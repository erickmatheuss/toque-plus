```js
(async function () {

  const app = document.getElementById('app');

  try {

    const unit = await getUnitFromLocation();

    const bg = document.getElementById('background');

    if (unit && unit.backgroundData) {

      bg.style.backgroundImage =
        'url("' + unit.backgroundData + '")';

      bg.style.opacity = '1';

      const blur =
        Number.isFinite(Number(unit.backgroundBlur))
          ? Number(unit.backgroundBlur)
          : 7;

      document.documentElement.style.setProperty(
        '--bg-blur',
        blur + 'px'
      );
    }

    if (!unit || unit.status !== 'configured') {

      app.innerHTML =
        '<section class="empty">' +
          '<strong>Toque+</strong>' +
          'Esta unidade ainda não foi configurada.' +
        '</section>';

      return;
    }

    const links = [
      ['whatsapp', 'WhatsApp', 'Fale conosco', unit.whatsapp],
      ['instagram', 'Instagram', 'Siga nosso perfil', unit.instagram],
      ['google', 'Google', 'Avalie nossa empresa', unit.google],
      ['maps', 'Como chegar', 'Abra no Maps', unit.maps],
      ['site', 'Nosso site', 'Conheça mais', unit.site]
    ].filter(function (item) {
      return item[3];
    });

    let html = '';

    html += '<section class="profile">';

    html += '<div class="logo-wrap">';

    if (unit.logoData) {

      html +=
        '<img src="' +
        unit.logoData +
        '" alt="Logo de ' +
        esc(unit.name) +
        '">';

    } else {

      html +=
        '<span class="initials">' +
        esc((unit.name || '').slice(0, 2).toUpperCase()) +
        '</span>';

    }

    html += '</div>';

    html +=
      '<h1 class="name">' +
      esc(unit.name) +
      '</h1>';

    if (unit.description) {

      html +=
        '<p class="description">' +
        esc(unit.description) +
        '</p>';

    }

    html += '</section>';

    html += '<section class="links">';

    links.forEach(function (item) {

      const type = item[0];
      const title = item[1];
      const sub = item[2];
      const href = item[3];

      html +=
        '<a class="link link-' +
        type +
        '" href="' +
        esc(href) +
        '" target="_blank" rel="noopener noreferrer" data-track="' +
        type +
        '">' +

        '<span class="icon">' +
        icon(type) +
        '</span>' +

        '<span class="copy">' +
          '<span class="title">' +
          title +
          '</span>' +

          '<span class="subtitle">' +
          sub +
          '</span>' +
        '</span>' +

        '<span class="arrow">›</span>' +

        '</a>';

    });

    html += '</section>';

    html +=
      '<footer class="footer">' +

        '<div class="brand">' +
          logoMark() +
          '<span>TOQUE+</span>' +
        '</div>' +

        '<div class="tagline">' +
          'Conectando negócios a pessoas.' +
        '</div>' +

      '</footer>';

    app.innerHTML = html;

    try {

      await trackAction(
        unit.id,
        'visualizacao'
      );

    } catch (e) {

      console.warn(
        'Não foi possível registrar a visualização:',
        e
      );

    }

    document.querySelectorAll('.link').forEach(function (el) {

      el.addEventListener('click', async function () {

        const type = el.dataset.track;

        try {

          await trackAction(
            unit.id,
            type
          );

        } catch (e) {

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

    const intro =
      document.createElement('div');

    intro.className = 'intro';

    intro.innerHTML =
      '<div class="intro-inner">' +

        logoMark() +

        '<div class="intro-word">' +
        'TOQUE+' +
        '</div>' +

        '<div class="intro-line"></div>' +

      '</div>';

    document.body.appendChild(intro);

  } catch (e) {

    console.error(e);

    app.innerHTML =
      '<section class="empty">' +

        '<strong>Toque+</strong>' +

        'Não foi possível carregar esta unidade agora.' +

        '<small>' +
        esc(e.message || 'Erro de conexão') +
        '</small>' +

      '</section>';

  }

})();
```
