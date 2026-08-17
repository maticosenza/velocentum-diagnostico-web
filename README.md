# Diagnóstico Ecommerce

Creá una aplicación web interna llamada "Velocentum · Cockpit de Diagnóstico".

Es una herramienta interna de uso privado para una agencia de performance marketing argentina. La usa el vendedor durante una videollamada con un prospecto dueño de una tienda e-commerce, compartiendo pantalla, para cargar datos del negocio y mostrar un diagnóstico.

Por ahora solo necesito el esqueleto de la aplicación. NO construyas todavía el formulario ni la lógica de cálculo.

Alcance de este primer paso:
1. Layout base con una barra lateral izquierda y área de contenido principal
2. Tres rutas vacías por ahora: listado de diagnósticos (home), nuevo diagnóstico, y detalle de un diagnóstico
3. Idioma: todo en español rioplatense (usá "vos" en vez de "tú")
4. Formato de moneda: pesos argentinos, con separador de miles con punto

Dirección estética — esto es importante, seguilo con cuidado:
- Es una herramienta de auditoría profesional, NO una landing de marketing
- Fondo claro, superficies blancas, mucho espacio en blanco
- Bordes finos de 1px muy sutiles, esquinas levemente redondeadas
- Color de acento principal: azul #2A1EC9. Acento secundario: violeta #7B5CFF. Usalos con moderación, solo para elementos activos y acciones primarias
- Tipografía sans-serif limpia, con solo dos pesos: regular y medium
- NO uses: glassmorphism, gradientes, sombras marcadas, fondos con grilla, tipografía display gigante, emojis
- Densidad de información alta pero ordenada: tiene que verse bien compartido en pantalla en una videollamada
- Referencia mental: un panel de analítica financiera serio, no un dashboard de startup

Idioma de la interfaz: español rioplatense en todo, incluyendo botones y mensajes de error.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/55b4992f-e588-4564-83ba-8f0f3af6bffe).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
