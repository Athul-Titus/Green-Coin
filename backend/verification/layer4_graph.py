"""
GreenCoin Verification — Layer 4: Social Graph Analysis
Detects collusion rings, Sybil networks, and graph-based fraud.
"""
import time
import networkx as nx
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session

from verification.models import GreenActionSubmission, LayerResult
from models.verification import GraphEdge, FraudFlag

logger = logging.getLogger("greencoin.verification.layer4")

class SocialGraphAnalyzer:
    def __init__(self, db: Session):
        self.db = db

    def _build_graph(self) -> nx.Graph:
        """
        Build networkx graph from PostgreSQL GraphEdge table.
        """
        G = nx.Graph()
        
        # In a real massive system, we'd only load the ego network or 2-hop neighborhood.
        # For MVP, load all recent edges (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        edges = self.db.query(GraphEdge).filter(GraphEdge.updated_at >= thirty_days_ago).all()
        
        for e in edges:
            G.add_edge(e.user_id_a, e.user_id_b, weight=e.weight, types=e.edge_types)
            
        return G

    def record_interaction(self, user_id_a: str, user_id_b: str, interaction_type: str, weight_increment: float = 0.1):
        """
        Record a social interaction (e.g. community vote, shared IP, same device history)
        """
        if user_id_a > user_id_b:
            user_id_a, user_id_b = user_id_b, user_id_a  # Enforce order to prevent duplicates
            
        edge = self.db.query(GraphEdge).filter(
            GraphEdge.user_id_a == user_id_a,
            GraphEdge.user_id_b == user_id_b
        ).first()
        
        if edge:
            edge.weight += weight_increment
            if interaction_type not in edge.edge_types:
                types = list(edge.edge_types)
                types.append(interaction_type)
                edge.edge_types = types
        else:
            edge = GraphEdge(
                user_id_a=user_id_a,
                user_id_b=user_id_b,
                weight=weight_increment,
                edge_types=[interaction_type]
            )
            self.db.add(edge)
            
        self.db.commit()

    def analyze_user(self, user_id: str) -> tuple[float, list, dict]:
        """
        Analyze a user's position in the social graph to find fraud patterns.
        """
        G = self._build_graph()
        
        flags = []
        signals = {}
        
        if user_id not in G:
            return 0.8, [], {'degree': 0}  # Neutral trust for isolated users
            
        degree = G.degree(user_id)
        signals['degree'] = degree
        
        # 1. High clustering with small network (Collusion Ring)
        # If a group of 5 users only interacts with each other (verifying each other's actions)
        ego_graph = nx.ego_graph(G, user_id, radius=1)
        if len(ego_graph) >= 3:
            clustering = nx.transitivity(ego_graph)
            signals['ego_clustering'] = clustering
            if clustering > 0.8:
                flags.append("HIGH_COLLUSION_PROBABILITY")
                
        # 2. Sybil Hub Detection
        # A user connected to many new accounts with only 'shared_ip' or 'same_device' edges
        suspicious_edges = 0
        for u, v, data in G.edges(user_id, data=True):
            types = data.get('types', [])
            if 'shared_ip' in types or 'shared_device' in types:
                suspicious_edges += 1
                
        if suspicious_edges >= 3:
            flags.append("SYBIL_HUB_SUSPECTED")
            signals['suspicious_edges'] = suspicious_edges
            
        # 3. Network Trust Propagation
        # If your neighbors have been flagged for fraud, your trust drops.
        flagged_neighbors = 0
        for neighbor in G.neighbors(user_id):
            fraud = self.db.query(FraudFlag).filter(FraudFlag.user_id == neighbor).count()
            if fraud > 0:
                flagged_neighbors += 1
                
        if flagged_neighbors > 0:
            signals['flagged_neighbors'] = flagged_neighbors
            if flagged_neighbors >= 2:
                flags.append("GUILT_BY_ASSOCIATION")
                
        # Calculate Trust Score
        score = 1.0
        if "SYBIL_HUB_SUSPECTED" in flags: score -= 0.5
        if "HIGH_COLLUSION_PROBABILITY" in flags: score -= 0.3
        if "GUILT_BY_ASSOCIATION" in flags: score -= 0.2
        
        return max(0.1, score), flags, signals

    def verify_action(self, action: GreenActionSubmission) -> LayerResult:
        start = time.time()
        
        trust_score, flags, signals = self.analyze_user(action.user_id)
        
        return LayerResult(
            layer=4,
            trust_score=float(trust_score),
            flags=flags,
            signals=signals,
            processing_time_ms=int((time.time() - start) * 1000)
        )
