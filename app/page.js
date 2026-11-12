"use client";

import { useState } from "react";
import { VAGAS } from "./vagas";
import Image from "next/image";
import logo from "./assets/imgs/logo.png";

const MAX_MB = 4;

export default function Page() {
  const [status, setStatus] = useState("idle"); // idle | sending | ok | error
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [vagasAtivas, setVagasAtivas] = useState({}); // { [vagaId]: boolean }
  const [lojas, setLojas] = useState({}); // { [vagaId]: string[] }

  function toggleVaga(id, ativa) {
    setVagasAtivas((prev) => ({ ...prev, [id]: ativa }));
    // Ao desmarcar a vaga, limpa as lojas escolhidas para ela.
    if (!ativa) setLojas((prev) => ({ ...prev, [id]: [] }));
  }

  function toggleLoja(id, loja, marcada) {
    setLojas((prev) => {
      const atual = new Set(prev[id] || []);
      if (marcada) atual.add(loja);
      else atual.delete(loja);
      return { ...prev, [id]: [...atual] };
    });
  }

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return setFileName("");
    if (file.size > MAX_MB * 1024 * 1024) {
      setMessage(`O arquivo excede ${MAX_MB} MB.`);
      setStatus("error");
      e.target.value = "";
      return setFileName("");
    }
    setStatus("idle");
    setMessage("");
    setFileName(file.name);
  }

  async function onSubmit(e) {
    e.preventDefault();

    const selecionadas = VAGAS.filter((v) => vagasAtivas[v.id]);
    if (selecionadas.length === 0) {
      setStatus("error");
      setMessage("Selecione pelo menos uma vaga de interesse.");
      return;
    }
    const semLoja = selecionadas.find((v) => !(lojas[v.id] || []).length);
    if (semLoja) {
      setStatus("error");
      setMessage(
        `Selecione pelo menos uma loja para a vaga "${semLoja.nome}".`,
      );
      return;
    }

    setStatus("sending");
    setMessage("");

    const form = e.currentTarget;
    try {
      const res = await fetch("/api/candidatura", {
        method: "POST",
        body: new FormData(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível enviar.");
      setStatus("ok");
      setMessage("Candidatura enviada com sucesso! Entraremos em contato.");
      form.reset();
      setFileName("");
      setVagasAtivas({});
      setLojas({});
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  }

  return (
    <main className="page">
      <div className="topbar" aria-hidden="true" />

      <div className="shell">
        <section className="context">
          <div className="logo">
            <Image src={logo} alt="Foto Paulo" priority width={200} />
          </div>
          <h1 className="title">Trabalhe conosco</h1>

          <p className="standfirst">
            Venha fazer parte da nossa equipe! Estamos em busca de novos
            talentos para atuar em nossas lojas nos principais shoppings de São
            Paulo. Candidate-se e faça parte do nosso time!
          </p>

          <ul className="roles">
            {VAGAS.map((v) => (
              <li key={v.id}>
                <span className="role-nome">{v.nome}</span>
                <span className="role-meta">{v.lojas.length} lojas</span>
              </li>
            ))}
          </ul>

          <p className="context-meta">
            São Paulo — SP · Currículo em PDF, DOC ou DOCX (até {MAX_MB} MB)
          </p>
        </section>

        <section className="formwrap">
          <form className="form" onSubmit={onSubmit} noValidate={false}>
            <fieldset className="group">
              <legend>Seus dados</legend>

              <label>
                Nome completo
                <input
                  name="nome"
                  type="text"
                  required
                  maxLength={120}
                  autoComplete="name"
                />
              </label>

              <div className="row">
                <label>
                  E-mail
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={160}
                    autoComplete="email"
                  />
                </label>
                <label>
                  Telefone / WhatsApp
                  <input
                    name="telefone"
                    type="tel"
                    required
                    maxLength={30}
                    autoComplete="tel"
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="group">
              <legend>Vaga e loja</legend>
              <p className="group-hint">
                Marque a(s) vaga(s) de interesse e escolha a(s) loja(s).
              </p>

              {VAGAS.map((v) => (
                <div
                  className={`vaga${vagasAtivas[v.id] ? " on" : ""}`}
                  key={v.id}
                >
                  <label className="vaga-head">
                    <input
                      type="checkbox"
                      name="vaga"
                      value={v.id}
                      checked={!!vagasAtivas[v.id]}
                      onChange={(e) => toggleVaga(v.id, e.target.checked)}
                    />
                    <span className="vaga-nome">{v.nome}</span>
                    <span className="vaga-count">{v.lojas.length} lojas</span>
                  </label>

                  {vagasAtivas[v.id] && (
                    <div className="lojas">
                      {v.lojas.map((loja) => (
                        <label className="chip" key={loja}>
                          <input
                            type="checkbox"
                            name={`lojas_${v.id}`}
                            value={loja}
                            checked={(lojas[v.id] || []).includes(loja)}
                            onChange={(e) =>
                              toggleLoja(v.id, loja, e.target.checked)
                            }
                          />
                          <span>{loja}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </fieldset>

            <fieldset className="group">
              <legend>Currículo e mensagem</legend>

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

              <label>
                Mensagem (opcional)
                <textarea name="mensagem" rows={4} maxLength={2000} />
              </label>
            </fieldset>

            {/* honeypot anti-spam: humanos não veem nem preenchem */}
            <input
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              className="hp"
              aria-hidden="true"
            />

            <button type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Enviando…" : "Enviar candidatura"}
            </button>

            {message && (
              <p
                className={`msg ${status === "ok" ? "ok" : "err"}`}
                role="status"
              >
                {message}
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
