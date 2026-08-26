import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { downloadBlob } from "./docxExport";
import type { GeneratedCoverLetter, StaticProfile } from "./types";

const font = "Calibri";
const bodySize = 22;

type BuildCoverLetterDocxInput = {
  profile: StaticProfile;
  coverLetter: GeneratedCoverLetter;
  companyName?: string;
  positionTitle?: string;
};

export async function buildCoverLetterDocx(input: BuildCoverLetterDocxInput): Promise<Blob> {
  const { profile, coverLetter, companyName } = input;
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const children: Paragraph[] = [];

  // Sender info
  children.push(textParagraph(profile.name, { bold: true }));
  if (profile.contact.location) {
    children.push(textParagraph(profile.contact.location));
  }
  if (profile.contact.email) {
    children.push(textParagraph(profile.contact.email));
  }
  if (profile.contact.phone) {
    children.push(textParagraph(profile.contact.phone));
  }

  // Date
  children.push(textParagraph("", { spacingAfter: 0 }));
  children.push(textParagraph(dateStr));

  // Addressee
  if (companyName) {
    children.push(textParagraph("", { spacingAfter: 0 }));
    children.push(textParagraph(companyName));
  }

  // Salutation
  children.push(textParagraph("", { spacingAfter: 0 }));
  children.push(textParagraph(coverLetter.salutation));

  // Body paragraphs
  children.push(textParagraph("", { spacingAfter: 0 }));
  children.push(bodyParagraph(coverLetter.opening.text));

  for (const p of coverLetter.body_paragraphs) {
    children.push(textParagraph("", { spacingAfter: 0 }));
    children.push(bodyParagraph(p.text));
  }

  children.push(textParagraph("", { spacingAfter: 0 }));
  children.push(bodyParagraph(coverLetter.closing.text));

  // Sign-off
  children.push(textParagraph("", { spacingAfter: 0 }));
  children.push(textParagraph(coverLetter.sign_off));
  children.push(textParagraph(profile.name, { bold: true }));

  const document = new Document({
    title: `${profile.name} Cover Letter`,
    creator: profile.name,
    description: "Cover Letter",
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
          }
        },
        children,
      },
    ],
  });

  return Packer.toBlob(document);
}

export async function exportCoverLetterDocx(
  profile: StaticProfile,
  coverLetter: GeneratedCoverLetter,
  companyName?: string,
  positionTitle?: string
) {
  const blob = await buildCoverLetterDocx({ profile, coverLetter, companyName, positionTitle });
  const fileName = `${profile.name.replace(/\s+/g, "_")}_Cover_Letter.docx`;
  downloadBlob(blob, fileName);
}

function textParagraph(
  text: string,
  options: { bold?: boolean; spacingAfter?: number } = {}
): Paragraph {
  return new Paragraph({
    spacing: { after: options.spacingAfter ?? 60 },
    children: [new TextRun({ text, bold: options.bold, font, size: bodySize })],
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120 },
    children: [new TextRun({ text, font, size: bodySize })],
  });
}
