FROM php:8.2-fpm

# Instalar dependencias de sistema necesarias
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    curl \
    libicu-dev \
    libzip-dev \
    libonig-dev \
    mariadb-client \
    && docker-php-ext-install pdo_mysql mbstring intl zip \
    && rm -rf /var/lib/apt/lists/*

# Instalar Composer globalmente
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Crear usuario no root
RUN groupadd -g 1000 ciuser \
    && useradd -u 1000 -g ciuser -m ciuser \
    && chown -R ciuser:ciuser /var/www/html

USER ciuser