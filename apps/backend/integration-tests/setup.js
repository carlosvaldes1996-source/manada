const { MetadataStorage } = require("@medusajs/framework/mikro-orm/core")

MetadataStorage.clear()

/**
 * Credenciales de la base para el runner de tests (`@medusajs/test-utils`).
 *
 * El runner crea y destruye una base efímera por corrida, pero para conectarse NO
 * lee `DATABASE_URL`: arma la URL desde `DB_USERNAME`/`DB_PASSWORD`/`DB_HOST`/`DB_PORT`
 * y cae a `postgres` como usuario por defecto. En una instalación local típica
 * (Homebrew) ese rol no existe, así que fallaba con `FATAL 28000` antes de correr
 * un solo test.
 *
 * Se derivan de `DATABASE_URL`, que todo el mundo ya tiene configurado, para que los
 * tests corran sin pedir variables extra ni un `.env.test` por máquina. Lo explícito
 * manda: si alguien ya definió `DB_*`, no se toca.
 */
const url = process.env.DATABASE_URL
if (url) {
  try {
    const { username, password, hostname, port } = new URL(url)
    if (!process.env.DB_USERNAME && username) {
      process.env.DB_USERNAME = decodeURIComponent(username)
    }
    if (!process.env.DB_PASSWORD && password) {
      process.env.DB_PASSWORD = decodeURIComponent(password)
    }
    if (!process.env.DB_HOST && hostname) process.env.DB_HOST = hostname
    if (!process.env.DB_PORT && port) process.env.DB_PORT = port
  } catch {
    // URL inválida: que el runner falle con su propio mensaje, no con el nuestro.
  }
}
