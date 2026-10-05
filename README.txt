TOQUE+ V6 — ESTRUTURA DO MVP

Esta versão ainda roda localmente, mas já prepara a arquitetura do produto real.

NOVIDADES V6
- Modelo de dados ampliado para clientes/unidades.
- Slug público por unidade: /q/cafe-central.
- Compatibilidade com ?unit=A001 para testes locais.
- URL pública calculada automaticamente.
- Botão para copiar URL.
- Status LIVRE/ATIVA das unidades.
- Estatísticas básicas: acessos e cliques em WhatsApp, Instagram, Google e Maps.
- Separação conceitual entre unidade física (A001 etc.) e cliente.
- Upload do logo Toque+ sem preview grande no configurador.
- Logo oficial continua sendo usado como PNG.

UNIDADES INICIAIS
A001–A005.

COMO TESTAR
1. Abra admin.html.
2. Escolha A001.
3. Preencha o nome e os demais dados.
4. Defina um identificador, por exemplo: cafe-central.
5. Salve e visualize.
6. A página local continuará abrindo com ?unit=A001.
7. A URL pública preparada aparecerá no painel como /q/cafe-central.

IMPORTANTE
Os dados ainda ficam no localStorage. Esta etapa prepara o modelo e a interface para a próxima migração para banco de dados (ex.: Supabase). O domínio não é necessário para desenvolver ou testar esta versão.

PRÓXIMA ETAPA
- Criar projeto de banco de dados.
- Migrar as unidades para banco.
- Fazer o configurador ler/gravar no banco.
- Configurar roteamento real /q/:slug.
- Gerar QR Code diretamente pelo painel.
- Depois conectar toquemais.com.br.
