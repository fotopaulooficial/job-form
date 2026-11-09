'use client';

import { useState } from 'react';

const MAX_MB = 4;

export default function Page() {
  const [status, setStatus] = useState('idle'); // idle | sending | ok | error
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return setFileName('');
    if (file.size > MAX_MB * 1024 * 1024) {
      setMessage(`O arquivo excede ${MAX_MB} MB.`);
      setStatus('error');
      e.target.value = '';
      return setFileName('');
    }
    setStatus('idle');
    setMessage('');
    setFileName(file.name);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    setMessage('');

    const form = e.currentTarget;
    try {
      const res = await fetch('/api/candidatura', {
        method: 'POST',
        body: new FormData(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar.');
      setStatus('ok');
      setMessage('Candidatura enviada com sucesso! Entraremos em contato.');
      form.reset();
      setFileName('');
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  return (
    <main className="wrap">
      <form className="card" onSubmit={onSubmit} noValidate={false}>
        <h1>Trabalhe conosco</h1>
        <p className="sub">Preencha os dados e anexe seu currículo.</p>

        <label>
          Nome completo
          <input name="nome" type="text" required maxLength={120} autoComplete="name" />
        </label>

        <div className="row">
          <label>
            E-mail
            <input name="email" type="email" required maxLength={160} autoComplete="email" />
          </label>
          <label>
            Telefone / WhatsApp
            <input name="telefone" type="tel" required maxLength={30} autoComplete="tel" />
          </label>
        </div>

        <label>
          Vaga de interesse
          <input name="vaga" type="text" required maxLength={120} placeholder="Ex.: Vendedor(a)" />
        </label>

        <label>
          Mensagem (opcional)
          <textarea name="mensagem" rows={4} maxLength={2000} />
        </label>

        <label>
          Currículo (PDF, DOC ou DOCX — até {MAX_MB} MB)
          <input
            name="curriculo"
            type="file"
            required
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={onFileChange}
          />
          {fileName && <span className="file">📎 {fileName}</span>}
        </label>

        {/* honeypot anti-spam: humanos não veem nem preenchem */}
        <input
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="hp"
          aria-hidden="true"
        />

        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Enviando…' : 'Enviar candidatura'}
        </button>

        {message && (
          <p className={status === 'ok' ? 'Candidatura enviada com sucesso! Entraremos em contato.' : 'Mensagem não enviada'} role="status">
            {message}
          </p>
      )}
    </form>
  </main>
)
}
