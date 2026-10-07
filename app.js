(async function(){

  const app = document.getElementById('app');
  const intro = document.getElementById('intro');

  let introFinished = !intro;
  let pageReady = false;

  function startPageAnimation(){

    if(!introFinished || !pageReady) return;

    app.classList.add('page-ready');

    const linksContainer = document.querySelector('.links');

    if(linksContainer){
      linksContainer.classList.add('animate-in');
    }

  }


  /*
    A animação da página só começa quando:
    1. a intro terminou
    2. os dados do cliente foram carregados
  */

  if(intro){

    intro.addEventListener('animationend', function(event){

      if(event.animationName === 'introOut'){

        introFinished = true;

        startPageAnimation();

      }

    });

  }


  try{

    const unit = await getUnitFromLocation();

    const bg = document.getElementById('background');


    /*
      Configura fundo
    */

    if(unit && unit.backgroundData){

      bg.style.backgroundImage = `url("${unit.backgroundData}")`;

      bg.style.opacity = '1';

      document.documentElement.style.setProperty(
        '--bg-blur',
        `${Number.isFinite(Number(unit.backgroundBlur)) ? Number(unit.backgroundBlur) : 7}px`
      );

    }


    /*
      Unidade inexistente ou não configurada
    */

    if(!unit || unit.status !== 'configured'){

      app.innerHTML = `
        <section class="empty">
          <strong>Toque+</strong>
          Esta unidade ainda não foi configurada.
        </section>
      `;

      pageReady = true;

      startPageAnimation();

      return;

    }


    /*
      Links disponíveis
    */

    const links = [
      ['whatsapp','WhatsApp','Fale conosco',unit.whatsapp],
      ['instagram','Instagram','Siga nosso perfil',unit.instagram],
      ['google','Google','Avalie nossa empresa',unit.google],
      ['maps','Como chegar','Abra no Maps',unit.maps],
      ['site','Nosso site','Conheça mais',unit.site]
    ].filter(x => x[3]);


    /*
      Monta página
    */

    app.innerHTML = `

      <section class="profile">

        <div class="logo-wrap">

          ${
            unit.logoData
            ?
            `<img
              class="client-logo"
              src="${unit.logoData}"
              alt="Logo de ${esc(unit.name)}"
              style="opacity:0"
            >`
            :
            `<span class="initials">
              ${esc((unit.name || '').slice(0,2).toUpperCase())}
            </span>`
          }

        </div>


        <h1 class="name">
          ${esc(unit.name)}
        </h1>


        ${
          unit.description
          ?
          `<p class="description">
            ${esc(unit.description)}
          </p>`
          :
          ''
        }

      </section>


      <section class="links">

        ${
          links.map(([type,title,sub,href], index) => `

            <a
              class="link link-${type}"
              href="${esc(href)}"
              target="_blank"
              rel="noopener noreferrer"
              data-track="${type}"
              style="--link-index:${index}"
            >

              <span class="icon">
                ${icon(type)}
              </span>


              <span class="copy">

                <span class="title">
                  ${title}
                </span>


                ${
                  type === 'google'
                  ?
                  `
                    <span class="subtitle google-subtitle">
                      ${sub}

                      <span class="google-stars">
                        <span>★</span>
                        <span>★</span>
                        <span>★</span>
                        <span>★</span>
                        <span>★</span>
                      </span>
                    </span>
                  `
                  :
                  `
                    <span class="subtitle">
                      ${sub}
                    </span>
                  `
                }

              </span>


              <span class="arrow">
                ›
              </span>

            </a>

          `).join('')
        }

      </section>


      <footer class="footer">

        <div class="brand">
          ${logoMark()}
          <span>TOQUE+</span>
        </div>


        <div class="tagline">
          Conectando negócios a pessoas.
        </div>

      </footer>

    `;


    /*
      Mostra a logo somente depois que o PNG
      estiver completamente carregado.
      Isso evita o flash da borda no Safari.
    */

    const clientLogo = document.querySelector('.client-logo');

    if(clientLogo){

      if(clientLogo.complete && clientLogo.naturalWidth > 0){

        clientLogo.style.opacity = '1';

      }else{

        clientLogo.addEventListener('load', function(){

          clientLogo.style.opacity = '1';

        }, {once:true});

      }

    }


    /*
      Os elementos da página já existem.
      Agora podemos liberar a animação.
    */

    pageReady = true;

    startPageAnimation();


    /*
      Registra visualização
    */

    try{

      await trackAction(
        unit.id,
        'visualizacao'
      );

    }catch(e){

      console.warn(
        'Não foi possível registrar a visualização:',
        e
      );

    }


    /*
      Animação das estrelas do Google
    */

    const googleLink = document.querySelector('.link-google');

    if(googleLink){

      setTimeout(() => {

        googleLink
          .querySelectorAll('.google-stars span')
          .forEach(star => {
            star.style.animationPlayState = 'running';
          });

      }, 550);

    }


    /*
      Rastreamento dos cliques
    */

    document
      .querySelectorAll('.link')
      .forEach(el => {

        el.addEventListener('click', async () => {

          const type = el.dataset.track;

          try{

            await trackAction(
              unit.id,
              type
            );

          }catch(e){

            console.warn(
              'Não foi possível registrar o clique:',
              e
            );

          }


          el.classList.remove('burst');

          void el.offsetWidth;

          el.classList.add('burst');

        });

      });


  }catch(e){

    console.error(e);

    app.innerHTML = `

      <section class="empty">

        <strong>
          Toque+
        </strong>

        Não foi possível carregar esta unidade agora.

        <small>
          ${esc(e.message || 'Erro de conexão')}
        </small>

      </section>

    `;

    pageReady = true;

    startPageAnimation();

  }

})();
