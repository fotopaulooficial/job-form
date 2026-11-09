import { Resend } from 'resend';

export const runtime = 'nodejs';

// Vercel limita o corpo da requisição a ~4,5 MB nas funções serverless.
const MAX_BYTES = 4 * 1024 * 1024;

const ALLOWED_EXT = ['pdf', 'doc', 'docx'];

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Confere os primeiros bytes para não confiar só na extensão/MIME informados.
function matchesSignature(buf, ext) {
  if (ext === 'pdf') return buf.subarray(0, 4).toString('latin1') === '%PDF';
  if (ext === 'docx') return buf[0] === 0x50 && buf[1] === 0x4b; // zip "PK"
  if (ext === 'doc')
    return buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0;
  return false;
}

function safeFilename(name) {
  return name.replace(/[^\w.\- ()]/g, '_').slice(0, 100);
}

export async function POST(request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    const to = process.env.RESEND_TO;

    if (!apiKey || !from || !to) {
      console.error('Variáveis RESEND_API_KEY / RESEND_FROM / RESEND_TO ausentes.');
      return Response.json({ error: 'Servidor não configurado.' }, { status: 500 });
    }

    const form = await request.formData();

    // Honeypot: bots preenchem; finge sucesso e descarta.
    if (form.get('website')) return Response.json({ ok: true });

    const nome = String(form.get('nome') || '').trim();
    const email = String(form.get('email') || '').trim();
    const telefone = String(form.get('telefone') || '').trim();
    const vaga = String(form.get('vaga') || '').trim();
    const mensagem = String(form.get('mensagem') || '').trim();
    const file = form.get('curriculo');

    if (!nome || !email || !telefone || !vaga) {
      return Response.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'E-mail inválido.' }, { status: 400 });
    }
    if (!file || typeof file === 'string' || file.size === 0) {
      return Response.json({ error: 'Anexe seu currículo.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: 'O currículo deve ter no máximo 4 MB.' }, { status: 400 });
    }

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return Response.json({ error: 'Formato inválido. Envie PDF, DOC ou DOCX.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesSignature(buffer, ext)) {
      return Response.json({ error: 'O arquivo parece corrompido ou não é um ' + ext.toUpperCase() + ' válido.' }, { status: 400 });
    }

    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from,
      to: to.split(',').map((s) => s.trim()),
      replyTo: email, // ao responder, vai direto para o candidato
      subject: `Candidatura: ${vaga} — ${nome}`.slice(0, 200),
      html: `
        <div style="font-family:Arial,sans-serif;font-size:15px;color:#222">
          <h2 style="margin:0 0 12px">Nova candidatura recebida</h2>
          <p><strong>Vaga:</strong> ${esc(vaga)}</p>
          <p><strong>Nome:</strong> ${esc(nome)}</p>
          <p><strong>E-mail:</strong> ${esc(email)}</p>
          <p><strong>Telefone:</strong> ${esc(telefone)}</p>
          ${
            mensagem
              ? `<p><strong>Mensagem:</strong><br>${esc(mensagem).replace(/\n/g, '<br>')}</p>`
              : ''
          }
          <p style="color:#666">Currículo em anexo.</p>
        </div>`,
      attachments: [{ filename: safeFilename(file.name), content: buffer }],
    });

    if (error) {
      console.error('Resend error:', error);
      return Response.json({ error: 'Falha ao enviar o e-mail. Tente novamente.' }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Erro inesperado. Tente novamente.' }, { status: 500 });
  }
}
