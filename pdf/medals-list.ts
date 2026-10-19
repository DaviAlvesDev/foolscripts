import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

interface Cabecalho {
  titulo: string;
  evento: string;
  data: string;
  instituicao: string;
}

interface Aluno {
  nome: string;
  nivel: string;
  medalha: string;
}

const arquivo = 'medalhistas_obr_2026.pdf';
const destino = path.join(os.homedir(), 'Downloads', arquivo);

const cabecalho: Cabecalho = {
  titulo: 'Lista de Alunos Premiados',
  evento: 'Olimpíada Brasileira de Robótica / Modalidade Teórica',
  data: 'Edição 2026',
  instituicao: 'COLÉGIO MILITAR DO RECIFE'
};

const alunos: Aluno[] = [
  {
    nome: 'Fillip Augusto de Mello Souza',
    nivel: 'Nível 3',
    medalha: 'Ouro'
  },
  {
    nome: 'Ana Beatriz de Souza Leão Marinho',
    nivel: 'Nível 3',
    medalha: 'Ouro'
  },
  {
    nome: 'Caio Estevam Becker França',
    nivel: 'Nível 3',
    medalha: 'Bronze'
  },
  {
    nome: 'BRUNO VINÍCIUS MELO TENÓRIO',
    nivel: 'Nível 4',
    medalha: 'Prata'
  },
  {
    nome: 'Daniel Gomes de Aguiar',
    nivel: 'Nível 4',
    medalha: 'Bronze'
  },
  {
    nome: 'Júlia Aleixo Melo',
    nivel: 'Nível 5',
    medalha: 'Ouro'
  }
]
.map((a) => { 
    return {
        nome:    toTitleCase(a.nome),
        nivel:   toTitleCase(a.nivel),
        medalha: toTitleCase(a.medalha),
    }
 })
.sort((a, b) => {
    if (a.medalha == b.medalha) {
        if (a.nivel == a.nivel) return sort_name(a, b);
        return sort_level(a, b);
    }

    return sort_medal(a, b);
});

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function sort_medal(a: Aluno, b: Aluno): number {
    if (a.medalha == b.medalha) return 0;

    if (b.medalha == 'Ouro') return 1;
    if (a.medalha == 'Ouro') return -1;

    if (b.medalha == 'Prata') return 1;
    if (a.medalha == 'Prata') return -1;

    if (b.medalha == 'Bronze') return 1;
    if (a.medalha == 'Bronze') return -1;

    return 0;
}

function sort_level(a: Aluno, b: Aluno): number {
    if (a.nivel == b.nivel) return 0;
    if (a.nivel < b.nivel) return -1;
    else return 1;
}

function sort_name(a: Aluno, b: Aluno): number {
    if (a.nome == b.nome) return 0;
    if (a.nome < b.nome) return -1;
    else return 1;
}

const CORES = {
  roxoEscuro: '#3B0764',
  roxoPrincipal: '#6D28D9',
  roxoMedio: '#8B5CF6',
  lilas: '#EDE9FE',
  lilasClaro: '#F7F5FF',
  branco: '#FFFFFF',
  texto: '#24152F',
  textoSuave: '#6B5B73'
} as const;

interface EstiloMedalha {
  background: string;
  borderColor: string;
  textColor: string;
}

function obterEstiloMedalha(medalha: string): EstiloMedalha {
  // Remove acentos e ignora maiúsculas para aceitar, por exemplo,
  // "OURO", "Ouro", "Menção Honrosa" ou "mencao honrosa".
  const valor = medalha
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (valor.includes('ouro')) {
    return {
      background: '#FFF1B8',
      borderColor: '#D6A514',
      textColor: '#73510A'
    };
  }

  if (valor.includes('prata')) {
    return {
      background: '#E9EDF2',
      borderColor: '#9AA3AE',
      textColor: '#46505C'
    };
  }

  if (valor.includes('bronze')) {
    return {
      background: '#F1D0B5',
      borderColor: '#B66A32',
      textColor: '#713817'
    };
  }

  if (valor.includes('mencao')) {
    return {
      background: CORES.lilas,
      borderColor: CORES.roxoMedio,
      textColor: CORES.roxoEscuro
    };
  }

  // Mantém a identidade roxa para qualquer premiação não reconhecida.
  return {
    background: CORES.lilasClaro,
    borderColor: CORES.roxoMedio,
    textColor: CORES.roxoPrincipal
  };
}

function gerarPdfListaMedalhistas(
  cabecalhoInfo: Cabecalho,
  listaAlunos: Aluno[],
  caminhoSaida: string
): void {
  const diretorio = path.dirname(caminhoSaida);

  if (!fs.existsSync(diretorio)) {
    fs.mkdirSync(diretorio, { recursive: true });
  }

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const maxY = pageHeight - margin - 20;

  const doc = new PDFDocument({
    size: 'A4',
    margin,
    bufferPages: true
  });

  const writeStream = fs.createWriteStream(caminhoSaida);
  doc.pipe(writeStream);

  // Faixa decorativa no topo da primeira página.
  doc.rect(0, 0, pageWidth, 8).fill(CORES.roxoPrincipal);

  // Nome: 55%; nível: 18%; medalha: 27%.
  const nameWidth = contentWidth * 0.55;
  const levelWidth = contentWidth * 0.18;
  const medalWidth = contentWidth - nameWidth - levelWidth;

  const nameX = margin;
  const levelX = nameX + nameWidth;
  const medalX = levelX + levelWidth;

  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(CORES.roxoEscuro)
    .text(cabecalhoInfo.titulo.toUpperCase(), margin, margin, {
      width: contentWidth,
      align: 'center'
    });

  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(CORES.roxoPrincipal).text(cabecalhoInfo.evento, {
    width: contentWidth,
    align: 'center'
  });

  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(10).fillColor(CORES.textoSuave).text(cabecalhoInfo.data, {
    width: contentWidth,
    align: 'center'
  });

  doc.moveDown(0.8);

  let currentY = doc.y;
  const institutionHeight = 22;

  doc
    .lineWidth(1)
    .rect(margin, currentY, contentWidth, institutionHeight)
    .fillAndStroke(CORES.lilas, CORES.roxoMedio);

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(CORES.roxoEscuro)
    .text(cabecalhoInfo.instituicao, margin + 8, currentY + 6, {
      width: contentWidth - 16,
      align: 'center'
    });

  currentY += institutionHeight + 15;

  function drawCell(
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      bold?: boolean;
      background?: string;
      borderColor?: string;
      textColor?: string;
      align?: 'left' | 'center';
    } = {}
  ): void {
    const borderColor = options.borderColor ?? CORES.roxoMedio;

    if (options.background) {
      doc.rect(x, y, width, height).fillAndStroke(options.background, borderColor);
    } else {
      doc.rect(x, y, width, height).stroke(borderColor);
    }

    doc
      .font(options.bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(9)
      .fillColor(options.textColor ?? CORES.texto);

    const availableWidth = width - 12;
    const textHeight = doc.heightOfString(text, { width: availableWidth });
    const textY = y + Math.max(0, (height - textHeight) / 2);

    doc.text(text, x + 6, textY, {
      width: availableWidth,
      align: options.align ?? 'left'
    });
  }

  function drawTableHeader(y: number): number {
    const height = 24;
    doc.lineWidth(0.8);

    drawCell('Nome', nameX, y, nameWidth, height, {
      bold: true,
      background: CORES.roxoPrincipal,
      borderColor: CORES.roxoEscuro,
      textColor: CORES.branco
    });
    drawCell('Nível', levelX, y, levelWidth, height, {
      bold: true,
      background: CORES.roxoPrincipal,
      borderColor: CORES.roxoEscuro,
      textColor: CORES.branco,
      align: 'center'
    });
    drawCell('Medalha', medalX, y, medalWidth, height, {
      bold: true,
      background: CORES.roxoPrincipal,
      borderColor: CORES.roxoEscuro,
      textColor: CORES.branco,
      align: 'center'
    });

    return y + height;
  }

  currentY = drawTableHeader(currentY);

  listaAlunos.forEach((aluno, index) => {
    doc.font('Helvetica').fontSize(9);

    const nameHeight = doc.heightOfString(aluno.nome, { width: nameWidth - 12 });
    const levelHeight = doc.heightOfString(aluno.nivel, { width: levelWidth - 12 });
    const medalHeight = doc.heightOfString(aluno.medalha, { width: medalWidth - 12 });
    const rowHeight = Math.max(30, nameHeight + 12, levelHeight + 12, medalHeight + 12);

    if (currentY + rowHeight > maxY) {
      doc.addPage();
      doc.rect(0, 0, pageWidth, 5).fill(CORES.roxoPrincipal);
      currentY = drawTableHeader(margin);
    }

    doc.lineWidth(0.8);
    const rowColor = index % 2 === 0 ? CORES.branco : CORES.lilasClaro;
    const medalStyle = obterEstiloMedalha(aluno.medalha);

    drawCell(aluno.nome, nameX, currentY, nameWidth, rowHeight, {
      bold: true,
      background: rowColor
    });
    drawCell(aluno.nivel, levelX, currentY, levelWidth, rowHeight, {
      background: rowColor,
      align: 'center'
    });
    drawCell(aluno.medalha, medalX, currentY, medalWidth, rowHeight, {
      bold: true,
      background: medalStyle.background,
      borderColor: medalStyle.borderColor,
      textColor: medalStyle.textColor,
      align: 'center'
    });

    currentY += rowHeight;
  });

  const range = doc.bufferedPageRange();

  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(CORES.roxoPrincipal)
      .text(`${i + 1} / ${range.count}`, margin, pageHeight - 30, {
        width: contentWidth,
        align: 'right',
        lineBreak: false
      });
  }

  doc.end();

  writeStream.on('finish', () => {
    console.log(`PDF gerado com sucesso em: ${caminhoSaida}`);
  });

  writeStream.on('error', (error) => {
    console.error('Erro ao salvar o PDF:', error);
  });
}

gerarPdfListaMedalhistas(cabecalho, alunos, destino);
