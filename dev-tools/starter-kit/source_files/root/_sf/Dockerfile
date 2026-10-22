# Ambiente di sviluppo locale: PHP + Apache.
# Il codice non viene copiato nell'immagine: compose.yaml monta la cartella del progetto.
# MySQL e MailHog restano sul Mac, i container li raggiungono come "host.docker.internal".
FROM php:8.3.36-apache-trixie

# Installer delle estensioni PHP (gestisce da solo le librerie di sistema necessarie)
COPY --from=mlocati/php-extension-installer:2.9.10 /usr/bin/install-php-extensions /usr/local/bin/

RUN install-php-extensions \
        pdo_mysql \
        intl \
        zip \
        gd \
        bcmath \
        opcache \
    && apt-get update \
    # mysqldump per utils:db-backup, unzip e git per composer
    && apt-get install -y --no-install-recommends default-mysql-client unzip git \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2.8 /usr/bin/composer /usr/local/bin/composer

RUN cp "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"
COPY docker/php/dev.ini $PHP_INI_DIR/conf.d/zz-dev.ini

# Apache: DocumentRoot su public/, .htaccess abilitato
COPY docker/apache/vhost.conf /etc/apache2/sites-available/000-default.conf
RUN a2enmod rewrite headers

WORKDIR /var/www/html
