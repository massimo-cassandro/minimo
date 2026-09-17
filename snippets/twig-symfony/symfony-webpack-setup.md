# symfony + webpack config


## symfony config folder

### `config/services.yaml`

```
parameters:
    assets_dir: '%env(ASSETS_DIR)%'
```

### `config/packages/framework.yaml`

```
# see https://symfony.com/doc/current/reference/configuration/framework.html
framework:
    # [...]

    assets:
        json_manifest_path: "%kernel.project_dir%/public/%env(ASSETS_DIR)%/manifest.json"
        # base_path: '%env(ASSETS_DIR)%'
        
        # manifest specifici
        packages:
            dashboard:
                json_manifest_path: "%kernel.project_dir%/public/dashboard/manifest.json"
```

### `config/packages/twig.yaml`

```
twig:
    file_name_pattern: '*.twig'

    form_themes:
        - '_tpl/incl/bs5-form-layout.html.twig'
    paths:
        '%kernel.project_dir%/public/%env(ASSETS_DIR)%': assets_path
        '%kernel.project_dir%/public': public_path
```


## .env e .env.dev (o .env.local o ...) 

In `.env`:

```
###> supporto webpack
# cartella, dentro public, in cui webpack salva js, css immagini ecc
ASSETS_DIR=build
###<
```

In `.env.dev`:

```
###> supporto webpack
# cartella, dentro public, in cui webpack salva js, css immagini ecc
ASSETS_DIR=_dev
###<
```


## .gitignore

Aggiungere

```
public/_dev
```
