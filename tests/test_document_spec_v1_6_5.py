"""v1.6.10 Word specification placement, icon rules and media-preservation checks."""
from pathlib import Path
from zipfile import ZipFile

from docx import Document

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs" / "Volley_Live_Capture_UI_Functional_Specification_EN_With_Original_Images.docx"


def test_corrected_specification_catalogue_and_original_images():
    doc = Document(DOC)
    assert doc.tables[1].cell(2, 1).text.strip() == "2.0"
    assert all("Version 2.0" in " ".join(p.text for p in section.footer.paragraphs) for section in doc.sections)
    full_text = "\n".join(p.text for p in doc.paragraphs)
    for requirement in ("Rot. Pn | Rn | Cn", "7 through 30", "light orange", "# · Player · Action · Result · Score"):
        assert requirement in full_text
    matrix_ids = [row.cells[0].text.strip() for row in doc.tables[8].rows]
    catalogue_ids = [row.cells[0].text.strip() for row in doc.tables[9].rows]
    for scenario in ("UI-ADV-POS-01", "UI-ADV-POS-02"):
        assert scenario not in matrix_ids
        assert catalogue_ids.count(scenario) == 1
    for scenario in (
        "UI6-UNDO-01", "UI6-HIS-01", "UI6-TEAM-01",
        "UI6-NET-01", "UI6-ACT-01", "UI6-ICON-01",
        "UI7-NET-01", "UI7-ACT-01",
        "MUI7-SCORE-01", "MUI7-NET-01", "MUI7-BENCH-01", "ICON10-01",
    ):
        assert catalogue_ids.count(scenario) == 1
    for requirement in (
        "9.6 Modification UI 6 refinements (v1.6.7)",
        "HISTORY starts collapsed",
        "three separate rounded blocks",
        "9.7 v1.6.8 visual corrections",
        "page background remains visible through the mesh",
        "no player silhouette icon",
        "9.8 Modification UI 7 (v1.6.9)",
        "same 5 px gap between every adjacent block",
        "shall not extend above the top tape or below the lower edge",
        "BENCH/input separation",
        "9.9 Borderless application artwork (v1.6.10)",
        "fully opaque RGB image",
        "no lighter perimeter, white or transparent corner",
        "IMG_5596.PNG",
    ):
        assert requirement in full_text
    assert len(doc.inline_shapes) == 11
    with ZipFile(DOC) as package:
        media = [name for name in package.namelist() if name.startswith("word/media/")]
    assert len(media) == 22
