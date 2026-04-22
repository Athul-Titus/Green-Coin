"""
GreenCoin — ESG Certificate Generator
Generates PDF certificates using ReportLab + QR codes.
"""
import os
import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, Any

logger = logging.getLogger(__name__)

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm, mm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
    from reportlab.platypus import HRFlowable
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    logger.warning("ReportLab not installed — PDF generation disabled")

try:
    import qrcode
    from PIL import Image as PILImage
    import io
    QR_AVAILABLE = True
except ImportError:
    QR_AVAILABLE = False


CERTS_DIR = os.path.join(os.path.dirname(__file__), "..", "certificates")
os.makedirs(CERTS_DIR, exist_ok=True)


class CertificateGenerator:
    """
    Generates professional ESG certificates for corporate credit purchases.
    """

    SDGS = {
        "cycling_commute":  [11, 13, 3],
        "public_transport": [11, 13],
        "plant_based_meal": [2, 12, 13, 15],
        "solar_energy":     [7, 13],
        "composting":       [12, 15],
        "ev_charging":      [7, 11, 13],
        "led_switch":       [7, 12],
        "no_flight":        [13, 9],
    }

    def generate(self, purchase, bundle, corporate, db) -> Dict[str, Any]:
        """
        Generate an ESG certificate PDF and store metadata.
        
        Returns: {certificate_id, certificate_number, download_url, pdf_path}
        """
        from models.credit import ESGCertificate
        from sqlalchemy.orm import Session

        cert_number = f"GC-{datetime.utcnow().strftime('%Y')}-{str(uuid.uuid4())[:8].upper()}"
        cert_id = str(uuid.uuid4())

        # Determine SDGs
        action_types = bundle.action_types or []
        sdg_set = set()
        action_breakdown = {}
        for at in action_types:
            code = at.get("type", "")
            credits = at.get("credits", 0)
            action_breakdown[code] = credits
            for sdg in self.SDGS.get(code, []):
                sdg_set.add(sdg)

        sdgs_addressed = sorted(list(sdg_set))
        tonnes_offset = purchase.credits_purchased / 100.0

        # Generate QR code
        qr_content = f"https://verify.greencoin.io/cert/{cert_id}"
        qr_image_path = None
        if QR_AVAILABLE:
            qr = qrcode.QRCode(version=1, box_size=6, border=2)
            qr.add_data(qr_content)
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="#1a472a", back_color="white")
            qr_image_path = os.path.join(CERTS_DIR, f"qr_{cert_id}.png")
            qr_img.save(qr_image_path)

        # Generate PDF
        pdf_path = None
        if REPORTLAB_AVAILABLE:
            pdf_path = os.path.join(CERTS_DIR, f"{cert_number}.pdf")
            self._build_pdf(
                pdf_path=pdf_path,
                cert_number=cert_number,
                company_name=corporate.company_name or corporate.full_name,
                tonnes_offset=tonnes_offset,
                credits_purchased=purchase.credits_purchased,
                action_breakdown=action_breakdown,
                sdgs_addressed=sdgs_addressed,
                purchase_date=purchase.purchased_at,
                qr_image_path=qr_image_path,
            )
            logger.info("📜 Certificate PDF generated: %s", pdf_path)

        # Store in DB
        cert = ESGCertificate(
            id=uuid.UUID(cert_id),
            purchase_id=purchase.id,
            corporate_id=corporate.id,
            certificate_number=cert_number,
            tonnes_offset=tonnes_offset,
            action_breakdown=action_breakdown,
            sdgs_addressed=sdgs_addressed,
            pdf_path=pdf_path,
            qr_code=qr_content,
        )
        db.add(cert)
        db.flush()

        return {
            "certificate_id": cert_id,
            "certificate_number": cert_number,
            "download_url": f"/certificates/{cert_number}.pdf" if pdf_path else None,
            "pdf_path": pdf_path,
            "qr_code": qr_content,
        }

    def _build_pdf(
        self,
        pdf_path: str,
        cert_number: str,
        company_name: str,
        tonnes_offset: float,
        credits_purchased: float,
        action_breakdown: Dict,
        sdgs_addressed: list,
        purchase_date: datetime,
        qr_image_path: str = None,
    ):
        """Build the PDF certificate using ReportLab."""
        GREEN_DARK = colors.HexColor("#1a472a")
        GREEN_MED = colors.HexColor("#2d6a4f")
        GREEN_LIGHT = colors.HexColor("#52b788")
        WHITE = colors.white
        GRAY = colors.HexColor("#6c757d")

        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=A4,
            rightMargin=2*cm, leftMargin=2*cm,
            topMargin=1.5*cm, bottomMargin=1.5*cm,
        )
        styles = getSampleStyleSheet()
        story = []

        # ── Header ─────────────────────────────────
        header_style = ParagraphStyle("header", fontSize=28, textColor=GREEN_DARK,
                                       fontName="Helvetica-Bold", alignment=TA_CENTER, spaceAfter=4)
        sub_style = ParagraphStyle("sub", fontSize=13, textColor=GREEN_MED,
                                    fontName="Helvetica", alignment=TA_CENTER, spaceAfter=6)
        story.append(Paragraph("🌱 GREENCOIN", header_style))
        story.append(Paragraph("CARBON CREDIT OFFSET CERTIFICATE", sub_style))
        story.append(HRFlowable(width="100%", thickness=2, color=GREEN_DARK))
        story.append(Spacer(1, 0.4*cm))

        # ── Certificate Number ──────────────────────
        cert_style = ParagraphStyle("cert", fontSize=11, textColor=GRAY,
                                     alignment=TA_CENTER, fontName="Helvetica")
        story.append(Paragraph(f"Certificate No: <b>{cert_number}</b>", cert_style))
        story.append(Paragraph(f"Issued: {purchase_date.strftime('%B %d, %Y')}", cert_style))
        story.append(Spacer(1, 0.6*cm))

        # ── This certifies that ──────────────────────
        cert_body = ParagraphStyle("body", fontSize=13, alignment=TA_CENTER, fontName="Helvetica",
                                    leading=22, spaceAfter=8)
        story.append(Paragraph("This certifies that", cert_body))
        company_style = ParagraphStyle("company", fontSize=22, textColor=GREEN_DARK,
                                        fontName="Helvetica-Bold", alignment=TA_CENTER, spaceAfter=8)
        story.append(Paragraph(f"<b>{company_name}</b>", company_style))
        story.append(Paragraph("has successfully offset", cert_body))

        tonnes_style = ParagraphStyle("tonnes", fontSize=36, textColor=GREEN_MED,
                                       fontName="Helvetica-Bold", alignment=TA_CENTER, spaceAfter=4)
        story.append(Paragraph(f"<b>{tonnes_offset:.2f} Tonnes CO₂e</b>", tonnes_style))
        story.append(Paragraph(
            f"through verified green lifestyle actions by individual contributors",
            cert_body
        ))
        story.append(Spacer(1, 0.5*cm))

        # ── Details Table ───────────────────────────
        action_names = {
            "cycling_commute": "Cycling Commute", "public_transport": "Public Transport",
            "plant_based_meal": "Plant-Based Meals", "solar_energy": "Solar Energy",
            "composting": "Composting", "ev_charging": "EV Charging",
            "led_switch": "LED Bulb Switch", "no_flight": "Avoided Flights",
        }
        breakdown_rows = [["Action Type", "Credits", "CO₂e (tonnes)"]]
        for code, creds in action_breakdown.items():
            breakdown_rows.append([
                action_names.get(code, code),
                f"{creds:,.0f}",
                f"{creds/100:.2f}",
            ])
        breakdown_rows.append(["TOTAL", f"{credits_purchased:,.0f}", f"{tonnes_offset:.2f}"])

        t = Table(breakdown_rows, colWidths=[8*cm, 4*cm, 4*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), GREEN_DARK),
            ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor("#f0faf4")]),
            ('BACKGROUND', (0, -1), (-1, -1), GREEN_LIGHT),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#dee2e6")),
            ('ROWBACKGROUNDS', (0, -1), (-1, -1), [GREEN_LIGHT]),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.5*cm))

        # ── GHG Statement ───────────────────────────
        ghg_style = ParagraphStyle("ghg", fontSize=9, textColor=GRAY, alignment=TA_CENTER,
                                    fontName="Helvetica-Oblique", leading=14)
        story.append(Paragraph(
            "This certificate aligns with GHG Protocol Scope 3 — Category 11 (Use of Sold Products). "
            "All credits have been verified by GreenCoin's ML-powered trust verification system.",
            ghg_style
        ))
        story.append(Spacer(1, 0.4*cm))

        # ── SDGs ────────────────────────────────────
        sdg_text = " | ".join(f"SDG {n}" for n in sdgs_addressed)
        story.append(Paragraph(f"<b>SDGs Addressed:</b> {sdg_text}", ghg_style))
        story.append(Spacer(1, 0.4*cm))

        # ── QR Code ─────────────────────────────────
        if qr_image_path and os.path.exists(qr_image_path):
            story.append(Paragraph("Scan to verify this certificate:", cert_body))
            story.append(RLImage(qr_image_path, width=3*cm, height=3*cm))

        story.append(Spacer(1, 0.5*cm))
        story.append(HRFlowable(width="100%", thickness=1, color=GREEN_LIGHT))
        story.append(Paragraph(
            "GreenCoin Pvt. Ltd. | verify.greencoin.io | support@greencoin.io",
            ghg_style
        ))

        doc.build(story)
