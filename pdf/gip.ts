import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import path from 'path';

interface Cabecalho {
  titulo: string;
  instituicao: string;
}

interface Aluno {
  nomeDeGuerra: string;
  numero: string;
  turma: string;
  gip?: string;
}

const arquivo = 'GIP.pdf';
const destino = path.resolve('/', 'home', 'davizera', 'Downloads', arquivo);

const cabecalho: Cabecalho = {
  titulo: 'Robótica - GIP',
  instituicao: 'COLEGIO MILITAR DO RECIFE',
};

const alunos: Aluno[] = [
    { nomeDeGuerra: 'Bianca Lins',   numero: '6939', turma: '101', gip: '1.0' },
    { nomeDeGuerra: 'Aleixo',        numero: '6695', turma: '105', gip: '1.0' },
    { nomeDeGuerra: 'Davi Alves',    numero: '6940', turma: '901', gip: '1.0' },
    { nomeDeGuerra: 'Levi Maciel',   numero: '6943', turma: '902', gip: '1.0' },
    { nomeDeGuerra: 'Daniel Aguiar', numero: '7137', turma: '801', gip: '1.0' },
    { nomeDeGuerra: 'Valentim',      numero: '7091', turma: '801', gip: '1.0' },
    { nomeDeGuerra: 'Teixeira',      numero: '7151', turma: '803', gip: '1.0' },
    { nomeDeGuerra: 'Pedro Melo',    numero: '7136', turma: '804', gip: '1.0' },
];

function gerarPdfListaGIP(
  cabecalhoInfo: Cabecalho,
  listaAlunos: Aluno[],
  caminhoSaida: string
): void {
  const diretorio = path.dirname(caminhoSaida);

  if (!fs.existsSync(diretorio)) {
    fs.mkdirSync(diretorio, { recursive: true });
  }

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    bufferPages: true,
  });

  const writeStream = fs.createWriteStream(caminhoSaida);
  doc.pipe(writeStream);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const maxY = pageHeight - margin - 40;

  const colWidths = [
    contentWidth * 0.40, // Nome de guerra
    contentWidth * 0.15, // Número
    contentWidth * 0.20, // Turma
    contentWidth * 0.25, // GIP
  ];

  const colX = [
    margin,
    margin + colWidths[0],
    margin + colWidths[0] + colWidths[1],
    margin + colWidths[0] + colWidths[1] + colWidths[2],
  ];

  // Título
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor('#000000')
    .text(cabecalhoInfo.titulo.toUpperCase(), margin, margin, {
      width: contentWidth,
      align: 'center',
    });

  doc.moveDown(0.8);

  // Caixa da instituição
  let currentY = doc.y;
  const institutionBoxHeight = 22;

  doc
    .lineWidth(1)
    .rect(margin, currentY, contentWidth, institutionBoxHeight)
    .fillAndStroke('#F0F0F0', '#000000');

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#000000')
    .text(cabecalhoInfo.instituicao, margin + 8, currentY + 6, {
      width: contentWidth - 16,
    });

  currentY += institutionBoxHeight + 15;

  function desenharCabecalhoTabela(y: number): number {
    const headerHeight = 26;
    const titulos = ['Nome de guerra', 'Número', 'Turma', 'GIP'];

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');

    titulos.forEach((titulo, i) => {
    doc
        .rect(colX[i], y, colWidths[i], headerHeight)
        .fillAndStroke('#E0E0E0', '#000000');

    doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#000000')
        .text(titulo, colX[i] + 5, y + 8, {
        width: colWidths[i] - 10,
        align: i === 0 ? 'left' : 'center',
        });
    });


    return y + headerHeight;
  }

  currentY = desenharCabecalhoTabela(currentY);

  for (const aluno of listaAlunos) {
    const rowHeight = 30;

    if (currentY + rowHeight > maxY) {
      doc.addPage();
      currentY = margin;
      currentY = desenharCabecalhoTabela(currentY);
    }

    const valores = [
      aluno.nomeDeGuerra,
      aluno.numero,
      aluno.turma,
      aluno.gip ?? '',
    ];

    valores.forEach((valor, i) => {
      doc
        .lineWidth(0.8)
        .rect(colX[i], currentY, colWidths[i], rowHeight)
        .stroke('#000000');

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#000000')
        .text(valor, colX[i] + 5, currentY + 10, {
          width: colWidths[i] - 10,
          align: i === 0 ? 'left' : 'center',
        });
    });

    currentY += rowHeight;
  }

  // Numeração das páginas
  const pageRange = doc.bufferedPageRange();
  doc.page.margins.bottom = 0;

  for (
    let i = pageRange.start;
    i < pageRange.start + pageRange.count;
    i++
  ) {
    doc.switchToPage(i);

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#444444')
      .text(`${i + 1} / ${pageRange.count}`, margin, pageHeight - 30, {
        width: contentWidth,
        align: 'right',
        lineBreak: false,
      });
  }

  doc.end();

  writeStream.on('finish', () => {
    console.log(`PDF gerado com sucesso em: ${caminhoSaida}`);
  });

  writeStream.on('error', (erro) => {
    console.error('Erro ao gerar o PDF:', erro);
  });
}

gerarPdfListaGIP(cabecalho, alunos, destino);
