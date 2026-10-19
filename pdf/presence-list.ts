import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import path from 'path';

// --- DEFINIÇÃO DE TIPOS ---
interface Cabecalho {
  titulo: string;
  evento: string;
  data: string;
  instituicao: string;
}

// --- VARIÁVEIS DE ENTRADA ---
const arquivo: string = 'classificados_N5.pdf';
const destino: string = path.resolve('/', 'home', 'davizera', 'Downloads', arquivo);

const cabecalho: Cabecalho = {
  titulo: 'Lista de Presença',
  evento: 'Olimpíada Brasileira de Robótica / Modalidade Teórica / Fase 2 / Nível 5',
  data: 'Data da prova: 13/08',
  instituicao: 'COLEGIO MILITAR DO RECIFE'
};

const alunos: string[] = [
  'JÚLIA ALEIXO MELO',
  'Helena da Rocha Medeiros',
];

// --- FUNÇÃO PARA GERAR O PDF COM PDFKIT ---
function gerarPdfListaPresenca(
  cabecalhoInfo: Cabecalho,
  listaAlunos: string[],
  caminhoSaida: string
): void {
  // Garantir que o diretório de destino exista
  const dir = path.dirname(caminhoSaida);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Instância do documento PDFKit (A4 em pontos: 595.28 x 841.89)
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    bufferPages: true
  });

  const writeStream = fs.createWriteStream(caminhoSaida);
  doc.pipe(writeStream);

  // Dimensões e Limites
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2; // 515.28pt
  const maxY = pageHeight - margin - 20; // Ponto limite vertical antes da quebra de página manual

  // Larguras das colunas
  const col1Width = contentWidth * 0.45; // 45% Nome
  const col2Width = contentWidth * 0.55; // 55% Assinatura
  const x1 = margin;
  const x2 = margin + col1Width;

  // --- CABEÇALHO ---
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor('#000000')
    .text(cabecalhoInfo.titulo.toUpperCase(), margin, margin, {
      width: contentWidth,
      align: 'center'
    });

  doc.moveDown(0.3);
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#000000')
    .text(cabecalhoInfo.evento, {
      width: contentWidth,
      align: 'center'
    });

doc.moveDown(0.3);
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#000000')
    .text(cabecalhoInfo.data, {
      width: contentWidth,
      align: 'center'
    });

  doc.moveDown(0.8);

  // Caixa da Instituição
  let currentY = doc.y;
  const instBoxHeight = 22;

  doc.lineWidth(1);
  doc.rect(x1, currentY, contentWidth, instBoxHeight).fillAndStroke('#F0F0F0', '#000000');
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#000000')
    .text(cabecalhoInfo.instituicao, x1 + 8, currentY + 6, {
      width: contentWidth - 16
    });

  currentY += instBoxHeight + 15;

  // Função auxiliar para desenhar o cabeçalho da tabela
  function drawTableHeader(y: number): number {
    const headerHeight = 22;
    doc.lineWidth(0.8);
    doc.rect(x1, y, col1Width, headerHeight).fillAndStroke('#E0E0E0', '#000000');
    doc.rect(x2, y, col2Width, headerHeight).fillAndStroke('#E0E0E0', '#000000');

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000');
    doc.text('Nome', x1 + 6, y + 6, { width: col1Width - 12 });
    doc.text('Assinatura', x2 + 6, y + 6, { width: col2Width - 12, align: 'center' });

    return y + headerHeight;
  }

  // Desenhar cabeçalho da tabela na primeira página
  currentY = drawTableHeader(currentY);

  // --- LINHAS DA TABELA (ALUNOS) ---
  listaAlunos.forEach((aluno) => {
    doc.font('Helvetica-Bold').fontSize(9);

    // Calcula a altura necessária para o texto do nome
    const textHeight = doc.heightOfString(aluno, { width: col1Width - 12 });
    const rowHeight = Math.max(28, textHeight + 12);

    // Quebra de página manual
    if (currentY + rowHeight > maxY) {
      doc.addPage();
      currentY = margin;
      currentY = drawTableHeader(currentY);
    }

    // Bordas das células
    doc.lineWidth(0.8);
    doc.rect(x1, currentY, col1Width, rowHeight).stroke('#000000');
    doc.rect(x2, currentY, col2Width, rowHeight).stroke('#000000');

    // Centralização vertical do texto do nome
    const textY = currentY + (rowHeight - textHeight) / 2;
    doc
      .fillColor('#000000')
      .text(aluno, x1 + 6, textY, { width: col1Width - 12 });

    currentY += rowHeight;
  });

  // --- RODAPÉ COM PAGINAÇÃO (Ex: "1 / 1") ---
  const range = doc.bufferedPageRange();

  // Zera a margem inferior temporariamente para o PDFKit não auto-gerar página extra
  doc.page.margins.bottom = 0;

  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const pageNum = i + 1;
    const totalPages = range.count;

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#444444')
      .text(`${pageNum} / ${totalPages}`, margin, pageHeight - 30, {
        width: contentWidth,
        align: 'right',
        lineBreak: false // Impede quebra de linha ao atingir o final da caixa
      });
  }

  doc.end();

  writeStream.on('finish', () => {
    console.log(`PDF gerado com sucesso em: ${caminhoSaida}`);
  });
}

// --- EXECUÇÃO DO SCRIPT ---
gerarPdfListaPresenca(cabecalho, alunos, destino);