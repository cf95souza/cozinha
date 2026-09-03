// Utilitário para impressão térmica (ESC/POS) e impressão via navegador
// Em produção web, a impressão térmica real precisa de:
// - Web USB API (Chrome/Edge) para impressoras USB locais
// - Ou um agente local (Node.js/Electron) que recebe comandos via WebSocket
// - Ou impressora de rede (IP/Porta) recebendo RAW TCP

export interface ReceiptData {
  companyName: string;
  companyDocument?: string;
  companyAddress?: string;
  branchName: string;
  saleId: string;
  date: Date;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    discountValue?: number;
  }>;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethods: Array<{ type: string; amount: number }>;
  cashReceived?: number;
  change?: number;
  cashierName: string;
  nfceUrl?: string;
}

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';

const ESC_POS = {
  INIT: ESC + '@',
  ALIGN_LEFT: ESC + 'a' + '\x00',
  ALIGN_CENTER: ESC + 'a' + '\x01',
  ALIGN_RIGHT: ESC + 'a' + '\x02',
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  DOUBLE_HEIGHT_ON: ESC + '!' + '\x10',
  DOUBLE_HEIGHT_OFF: ESC + '!' + '\x00',
  CUT_PAPER: GS + 'V' + '\x00',
  OPEN_DRAWER: ESC + 'p' + '\x00' + '\x19' + '\xFA', // Pino 2, 50ms
  FEED_LINES: (n: number) => ESC + 'd' + String.fromCharCode(n),
};

// Gera comandos ESC/POS brutos para impressora térmica
export function generateESCPosCommands(data: ReceiptData): Uint8Array {
  const encoder = new TextEncoder();
  const lines: string[] = [];

  lines.push(ESC_POS.INIT);
  lines.push(ESC_POS.ALIGN_CENTER);
  lines.push(ESC_POS.BOLD_ON);
  lines.push(ESC_POS.DOUBLE_HEIGHT_ON);
  lines.push(data.companyName + '\n');
  lines.push(ESC_POS.DOUBLE_HEIGHT_OFF);
  lines.push(ESC_POS.BOLD_OFF);

  if (data.companyDocument) lines.push(data.companyDocument + '\n');
  if (data.companyAddress) lines.push(data.companyAddress + '\n');
  lines.push(data.branchName + '\n');
  lines.push('-'.repeat(32) + '\n');

  lines.push(ESC_POS.ALIGN_LEFT);
  lines.push(`Venda: ${data.saleId.slice(0, 8)}\n`);
  lines.push(`Data: ${data.date.toLocaleString('pt-BR')}\n`);
  lines.push(`Operador: ${data.cashierName}\n`);
  lines.push('-'.repeat(32) + '\n');

  // Cabeçalho itens
  lines.push('Item'.padEnd(20) + 'Qtd'.padStart(4) + 'Vl.Unit'.padStart(10) + 'Total'.padStart(10) + '\n');
  lines.push('-'.repeat(32) + '\n');

  for (const item of data.items) {
    const name = item.name.length > 18 ? item.name.slice(0, 18) : item.name.padEnd(18);
    const qty = item.quantity.toString().padStart(4);
    const unit = item.unitPrice.toFixed(2).padStart(8);
    const total = item.total.toFixed(2).padStart(8);
    lines.push(`${name}${qty}${unit}${total}\n`);
    
    if (item.discountValue && item.discountValue > 0) {
      lines.push(`  Desc: ${item.discountValue.toFixed(2)}\n`);
    }
  }

  lines.push('-'.repeat(32) + '\n');
  lines.push(ESC_POS.ALIGN_RIGHT);
  lines.push(`Subtotal:     R$ ${data.subtotal.toFixed(2)}\n`);
  if (data.discountAmount > 0) {
    lines.push(`Desconto:    -R$ ${data.discountAmount.toFixed(2)}\n`);
  }
  lines.push(ESC_POS.BOLD_ON);
  lines.push(`TOTAL:        R$ ${data.totalAmount.toFixed(2)}\n`);
  lines.push(ESC_POS.BOLD_OFF);
  lines.push('-'.repeat(32) + '\n');

  lines.push(ESC_POS.ALIGN_LEFT);
  lines.push('Pagamentos:\n');
  for (const pm of data.paymentMethods) {
    lines.push(`  ${pm.type.padEnd(10)} R$ ${pm.amount.toFixed(2)}\n`);
  }

  if (data.cashReceived !== undefined && data.change !== undefined) {
    lines.push(`  Recebido:   R$ ${data.cashReceived.toFixed(2)}\n`);
    lines.push(`  Troco:      R$ ${data.change.toFixed(2)}\n`);
  }

  if (data.nfceUrl) {
    lines.push('-'.repeat(32) + '\n');
    lines.push(ESC_POS.ALIGN_CENTER);
    lines.push('NFC-e Emitida com Sucesso\n');
    lines.push('Consulte via Leitor de QR Code\n');
    lines.push(data.nfceUrl + '\n');
  }

  lines.push('-'.repeat(32) + '\n');
  lines.push(ESC_POS.ALIGN_CENTER);
  lines.push('Obrigado pela preferencia!\n');
  lines.push('Volte sempre!\n');
  lines.push(ESC_POS.FEED_LINES(3));
  lines.push(ESC_POS.CUT_PAPER);
  lines.push(ESC_POS.OPEN_DRAWER);

  const fullText = lines.join('');
  return encoder.encode(fullText);
}

// Gera HTML otimizado para impressão via navegador (window.print)
export function generateReceiptHTML(data: ReceiptData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Cupom Fiscal - ${data.saleId.slice(0, 8)}</title>
  <style>
    @media print {
      @page { margin: 0; size: 80mm auto; }
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
    }
    body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0 auto; padding: 10px; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .double-height { font-size: 18px; line-height: 1.2; }
    hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .item-row { display: flex; font-size: 11px; }
    .item-name { flex: 1; }
    .item-qty { width: 30px; text-align: right; }
    .item-unit { width: 55px; text-align: right; }
    .item-total { width: 55px; text-align: right; }
    .total-row { font-size: 14px; font-weight: bold; margin-top: 5px; }
    .payment-row { display: flex; justify-content: space-between; font-size: 11px; }
    button { margin-top: 10px; padding: 10px; width: 100%; font-size: 14px; }
  </style>
</head>
<body>
  <div class="center bold double-height">${data.companyName}</div>
  ${data.companyDocument ? `<div class="center">${data.companyDocument}</div>` : ''}
  ${data.companyAddress ? `<div class="center">${data.companyAddress}</div>` : ''}
  <div class="center bold">${data.branchName}</div>
  <hr>
  <div class="row"><span>Venda: ${data.saleId.slice(0, 8)}</span></div>
  <div class="row"><span>Data: ${data.date.toLocaleString('pt-BR')}</span></div>
  <div class="row"><span>Operador: ${data.cashierName}</span></div>
  <hr>
  <div class="item-row bold">
    <span class="item-name">Item</span>
    <span class="item-qty">Qtd</span>
    <span class="item-unit">Vl.Unit</span>
    <span class="item-total">Total</span>
  </div>
  <hr>
  ${data.items.map(item => `
    <div class="item-row">
      <span class="item-name">${item.name.length > 22 ? item.name.slice(0, 22) : item.name}</span>
      <span class="item-qty">${item.quantity}</span>
      <span class="item-unit">${item.unitPrice.toFixed(2)}</span>
      <span class="item-total">${item.total.toFixed(2)}</span>
    </div>
    ${item.discountValue && item.discountValue > 0 ? `<div class="item-row"><span class="item-name">  Desc: ${item.discountValue.toFixed(2)}</span></div>` : ''}
  `).join('')}
  <hr>
  <div class="row"><span>Subtotal</span><span>R$ ${data.subtotal.toFixed(2)}</span></div>
  ${data.discountAmount > 0 ? `<div class="row"><span>Desconto</span><span>-R$ ${data.discountAmount.toFixed(2)}</span></div>` : ''}
  <div class="row total-row"><span>TOTAL</span><span>R$ ${data.totalAmount.toFixed(2)}</span></div>
  <hr>
  <div class="bold">Pagamentos:</div>
  ${data.paymentMethods.map(pm => `<div class="payment-row"><span>${pm.type}</span><span>R$ ${pm.amount.toFixed(2)}</span></div>`).join('')}
  ${data.cashReceived !== undefined ? `
    <div class="payment-row"><span>Recebido</span><span>R$ ${data.cashReceived.toFixed(2)}</span></div>
    <div class="payment-row"><span>Troco</span><span>R$ ${data.change.toFixed(2)}</span></div>
  ` : ''}
  ${data.nfceUrl ? `
    <hr>
    <div class="center bold" style="margin-top: 10px;">NFC-e Emitida com Sucesso</div>
    <div class="center" style="margin-bottom: 5px;">Consulte pelo link ou QR Code:</div>
    <div class="center"><a href="${data.nfceUrl}" target="_blank" style="word-break: break-all; font-size: 10px;">${data.nfceUrl}</a></div>
  ` : ''}
  <hr>
  <div class="center">Obrigado pela preferência!</div>
  <div class="center">Volte sempre!</div>
  <div style="height: 20px;"></div>
  <button class="no-print" onclick="window.print()">Imprimir / Salvar PDF</button>
  <script>window.onload = () => window.print();</script>
</body>
</html>
`;
}

// Abre janela de impressão do navegador com o cupom
export function printReceiptBrowser(data: ReceiptData): void {
  const html = generateReceiptHTML(data);
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

// Tenta imprimir via Web USB (Chrome/Edge) - requer permissão do usuário
export async function printReceiptUSB(data: ReceiptData): Promise<boolean> {
  try {
    // @ts-ignore - Web USB API
    if (!navigator.usb) throw new Error('Web USB não suportado');
    
    // @ts-ignore
    const device = await navigator.usb.requestDevice({ filters: [] });
    // @ts-ignore
    await device.open();
    // @ts-ignore
    await device.selectConfiguration(1);
    // @ts-ignore
    await device.claimInterface(0);
    
    const commands = generateESCPosCommands(data);
    // @ts-ignore
    await device.transferOut(1, commands);
    
    // @ts-ignore
    await device.close();
    return true;
  } catch (error) {
    console.warn('Impressão USB falhou:', error);
    return false;
  }
}