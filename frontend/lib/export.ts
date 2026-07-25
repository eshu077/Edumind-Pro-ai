export function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// Strips markdown syntax down to readable plain-text lines — good enough
// for a study PDF, not a full markdown-to-PDF renderer.
export function markdownToPlainLines(markdown: string): string[] {
  return markdown.split("\n").map((line) =>
    line
      .replace(/^#+\s*/, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/^[-*]\s+/, "• ")
  );
}

export async function downloadCertificate(userName: string, achievementTitle: string, dateStr: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  doc.setDrawColor(245, 166, 35);
  doc.setLineWidth(4);
  doc.rect(24, 24, width - 48, height - 48);
  doc.setLineWidth(1);
  doc.rect(34, 34, width - 68, height - 68);

  doc.setFont("times", "bold");
  doc.setFontSize(28);
  doc.text("Certificate of Completion", width / 2, 130, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.text("This certifies that", width / 2, 175, { align: "center" });

  doc.setFont("times", "bold");
  doc.setFontSize(24);
  doc.text(userName, width / 2, 210, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.text("has successfully completed", width / 2, 240, { align: "center" });

  doc.setFont("times", "bold");
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(achievementTitle, width - 160) as string[];
  doc.text(titleLines, width / 2, 270, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text(dateStr, width / 2, height - 80, { align: "center" });
  doc.text("EduMind Pro AI", width / 2, height - 60, { align: "center" });

  doc.save(`Certificate - ${achievementTitle}.pdf`);
}

export async function downloadPdfFromLines(filename: string, title: string, lines: string[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(title, maxWidth) as string[];
  doc.text(titleLines, margin, y);
  y += titleLines.length * 20 + 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  for (const rawLine of lines) {
    const wrapped = doc.splitTextToSize(rawLine || " ", maxWidth) as string[];
    for (const wline of wrapped) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(wline, margin, y);
      y += 16;
    }
  }

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
