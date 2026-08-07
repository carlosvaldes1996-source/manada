import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ProseBlock, ProseList } from "@/components/layout/content-page";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Política de privacidad",
  alternates: { canonical: "/privacidad" },
};

/**
 * Buzón único de privacidad: es el MISMO remitente de los correos transaccionales
 * (`RESEND_FROM`, D49), así que quien recibe un mail de Manada puede responder al
 * mismo lugar donde ejerce sus derechos. No se inventa un alias nuevo a propósito.
 */
const PRIVACY_EMAIL = `contacto@${SITE.domain}`;

function MailLink() {
  return (
    <a
      href={`mailto:${PRIVACY_EMAIL}`}
      className="font-semibold text-text-brand underline-offset-2 hover:underline"
    >
      {PRIVACY_EMAIL}
    </a>
  );
}

export default function PrivacidadPage() {
  return (
    <ContentPage
      title="Política de privacidad"
      lead="Cuidamos los datos tuyos y de tu mascota con el mismo cariño que a tu compañero. Acá te contamos, sin letra chica, qué guardamos, para qué y cómo lo controlas tú."
      updated="6 de agosto de 2026"
    >
      <ProseBlock heading="Quién responde por tus datos">
        <p>
          {SITE.name} ({SITE.domain}) es el responsable de los datos personales que tratamos en este
          sitio, en tu cuenta, en tus compras y en tu suscripción. Para cualquier tema de privacidad
          —incluido ejercer tus derechos— escríbenos a <MailLink />.
        </p>
        <p>
          Nos regimos por la Ley 19.628 sobre protección de la vida privada y por la Ley 19.496 de
          protección al consumidor. Esta política ya está escrita con el estándar de la Ley 21.719,
          la nueva ley chilena de datos personales que entra en vigencia el 1 de diciembre de 2026.
        </p>
      </ProseBlock>

      <ProseBlock heading="Qué datos recogemos">
        <p>Solo lo que necesitamos para atenderte bien:</p>
        <ProseList>
          <li>
            <strong>Identificación y contacto:</strong> nombre, apellido, correo y teléfono.
          </li>
          <li>
            <strong>RUT:</strong> únicamente para emitir tu boleta.
          </li>
          <li>
            <strong>Entrega:</strong> dirección, comuna, región y las referencias que nos indiques.
          </li>
          <li>
            <strong>Cuenta:</strong> tu correo y tu contraseña, que se guarda cifrada — nadie en{" "}
            {SITE.name} puede verla.
          </li>
          <li>
            <strong>Perfil de tu mascota:</strong> nombre, especie, raza, etapa de vida, peso, las
            condiciones de salud que declares y su foto si la subes.
          </li>
          <li>
            <strong>Compras:</strong> pedidos, montos, medio de pago usado, historial y estado de tu
            suscripción.
          </li>
          <li>
            <strong>Navegación:</strong> páginas y productos que ves, lo que agregas al carrito, tu
            dispositivo y navegador, dirección IP, desde qué campaña o enlace llegaste, y un
            identificador aleatorio propio que no contiene ningún dato tuyo.
          </li>
        </ProseList>
      </ProseBlock>

      <ProseBlock heading="Para qué los usamos">
        <p>Cada dato tiene una razón y un fundamento:</p>
        <ProseList>
          <li>
            <strong>Para cumplir tu compra:</strong> procesar el pedido, cobrarlo, despacharlo,
            coordinar la entrega, atender tu postventa y administrar tu suscripción.
          </li>
          <li>
            <strong>Porque la ley nos obliga:</strong> emitir la boleta y conservar los documentos
            tributarios y de consumo por los plazos legales.
          </li>
          <li>
            <strong>Porque tú nos lo permites:</strong> conocer a tu mascota para recomendarte lo
            adecuado y anticipar cuándo se le acaba la comida; y las cookies de medición y
            publicidad.
          </li>
          <li>
            <strong>Por interés legítimo nuestro:</strong> mantener el sitio seguro, prevenir
            fraudes, corregir errores y entender de forma agregada qué funciona en la tienda.
          </li>
        </ProseList>
        <p>
          <strong>No vendemos ni arrendamos tus datos.</strong> Tampoco tomamos decisiones
          automatizadas con efectos legales sobre ti: nuestra recomendación es una sugerencia, la
          última palabra siempre es tuya.
        </p>
      </ProseBlock>

      <ProseBlock heading="Los datos de tu mascota">
        <p>
          El perfil de tu compañero es el corazón de {SITE.name}: con él calculamos porciones,
          duración del alimento y qué le conviene. Lo usamos solo para eso y para mostrarte tu propia
          información en tu cuenta.
        </p>
        <p>
          Es información de tu mascota, no un diagnóstico:{" "}
          <strong>nuestras recomendaciones no reemplazan a tu veterinario.</strong> Puedes editar o
          borrar el perfil, incluida la foto, cuando quieras desde{" "}
          <Link
            href="/cuenta/mascotas"
            className="font-semibold text-text-brand underline-offset-2 hover:underline"
          >
            tu cuenta
          </Link>
          .
        </p>
      </ProseBlock>

      <ProseBlock heading="Cookies, almacenamiento local e identificadores">
        <p>Usamos tres tipos, y se distinguen fácil:</p>
        <ProseList>
          <li>
            <strong>Necesarias:</strong> mantienen tu sesión iniciada, tu carrito entre visitas, el
            borrador del onboarding y tus búsquedas recientes. Sin ellas la tienda no funciona. La
            foto de tu mascota, mientras no tengas cuenta, vive solo en tu propio dispositivo.
          </li>
          <li>
            <strong>De medición:</strong> cargamos Google Tag Manager y, a través de él, Google
            Analytics, para saber cómo se usa el sitio de forma agregada.
          </li>
          <li>
            <strong>De publicidad:</strong> el pixel de Meta, para medir nuestras campañas y
            mostrarte avisos más pertinentes.
          </li>
        </ProseList>
        <p>
          Además guardamos un <strong>identificador aleatorio</strong> de tu navegador para reconocer
          la misma visita entre sesiones y entender dónde se traba la compra. Es propio, no viaja a
          otros sitios y no contiene tu nombre, correo ni ningún dato personal.
        </p>
        <p>
          Puedes bloquear o borrar todo esto desde la configuración de tu navegador (cookies y datos
          del sitio). La tienda seguirá funcionando; solo dejaremos de medir.
        </p>
      </ProseBlock>

      <ProseBlock heading="Con quién los compartimos">
        <p>Con nadie más de lo indispensable, y siempre para prestarte el servicio:</p>
        <ProseList>
          <li>
            <strong>Flow:</strong> procesa tus pagos.
          </li>
          <li>
            <strong>Resend:</strong> envía los correos de tu pedido, tu cuenta y tu suscripción.
          </li>
          <li>
            <strong>Vercel y Railway:</strong> alojan el sitio, el sistema y la base de datos.
          </li>
          <li>
            <strong>Google y Meta:</strong> medición y publicidad, con los datos de navegación
            descritos arriba.
          </li>
          <li>
            <strong>El courier o quien haga la entrega:</strong> recibe tu nombre, dirección y
            teléfono, nada más.
          </li>
          <li>
            <strong>Autoridades:</strong> solo cuando una ley o una orden judicial nos lo exija.
          </li>
        </ProseList>
      </ProseBlock>

      <ProseBlock heading="Dónde se guardan">
        <p>
          Parte de nuestros proveedores opera servidores fuera de Chile, principalmente en Estados
          Unidos. Al comprar y crear tu cuenta, tus datos pueden almacenarse y procesarse allí, bajo
          los contratos de servicio y las medidas de seguridad que exigimos a cada proveedor.
        </p>
      </ProseBlock>

      <ProseBlock heading="Tu tarjeta no la guardamos">
        <p>
          Los datos de tu tarjeta se ingresan y procesan en Flow, nuestra pasarela de pagos:{" "}
          <strong>{SITE.name} nunca ve ni almacena el número completo ni el código de seguridad.</strong>{" "}
          Si eliges guardar una tarjeta para tus próximas compras, en nuestro sistema solo queda la
          marca, los últimos cuatro dígitos y un identificador que nos entrega la pasarela.
        </p>
      </ProseBlock>

      <ProseBlock heading="Cuánto tiempo los conservamos">
        <ProseList>
          <li>
            <strong>Tu cuenta y el perfil de tu mascota:</strong> mientras la cuenta exista. Si nos
            pides eliminarla, la borramos o anonimizamos dentro de 30 días.
          </li>
          <li>
            <strong>Pedidos, boletas y respaldos tributarios:</strong> 6 años, porque la ley
            tributaria y la de protección al consumidor nos obligan a conservarlos.
          </li>
          <li>
            <strong>Datos de navegación y medición:</strong> hasta 24 meses; después se eliminan o
            quedan solo como estadísticas agregadas que no te identifican.
          </li>
        </ProseList>
      </ProseBlock>

      <ProseBlock heading="Tus derechos">
        <p>Sobre tus datos personales puedes, en cualquier momento:</p>
        <ProseList>
          <li>
            <strong>Acceder</strong> a los datos que tenemos de ti y saber cómo los usamos.
          </li>
          <li>
            <strong>Rectificar</strong> lo que esté incompleto o equivocado.
          </li>
          <li>
            <strong>Eliminar</strong> tus datos y tu cuenta, salvo lo que debamos conservar por ley.
          </li>
          <li>
            <strong>Oponerte</strong> a un uso determinado o <strong>revocar</strong> el
            consentimiento que nos diste, sin que eso afecte lo hecho antes.
          </li>
          <li>
            <strong>Bloquear</strong> temporalmente el tratamiento mientras revisamos un reclamo.
          </li>
          <li>
            <strong>Portar</strong> tus datos: te los entregamos en un formato estructurado y de uso
            común.
          </li>
        </ProseList>
        <p>
          Tus datos de contacto, direcciones y mascotas los editas tú mismo desde{" "}
          <Link
            href="/cuenta"
            className="font-semibold text-text-brand underline-offset-2 hover:underline"
          >
            tu cuenta
          </Link>
          . Para todo lo demás, escríbenos a <MailLink /> desde el correo con el que compraste:{" "}
          <strong>te respondemos dentro de 30 días corridos.</strong> Si la solicitud es delicada,
          podemos pedirte que acredites tu identidad antes de ejecutarla.
        </p>
        <p>
          Si crees que no te respondimos bien, puedes reclamar ante la autoridad de protección de
          datos personales y, en materia de consumo, ante el SERNAC.
        </p>
      </ProseBlock>

      <ProseBlock heading="Cómo los cuidamos">
        <p>
          El sitio funciona sobre conexiones cifradas (HTTPS), las contraseñas se guardan cifradas,
          el acceso a la base de datos está restringido a quien lo necesita para operar la tienda y
          no almacenamos datos de tarjetas.
        </p>
        <p>
          Ningún sistema es infalible. Si ocurriera un incidente de seguridad que afecte tus datos,
          te avisaremos a ti y a la autoridad sin demora, contándote qué pasó y qué hacer.
        </p>
      </ProseBlock>

      <ProseBlock heading="Menores de edad">
        <p>
          {SITE.name} está dirigido a mayores de 18 años. No recogemos a sabiendas datos de menores
          de edad; si detectamos alguno sin la autorización de su madre, padre o representante, lo
          eliminamos.
        </p>
      </ProseBlock>

      <ProseBlock heading="Los correos que te enviamos">
        <p>
          Los correos de tu pedido, tu cuenta y tu suscripción son parte del servicio y no se pueden
          desactivar mientras tengas compras activas. Los correos promocionales, en cambio, siempre
          traen un enlace para darte de baja, y también puedes pedírnoslo a <MailLink />.
        </p>
      </ProseBlock>

      <ProseBlock heading="Cambios a esta política">
        <p>
          Si cambiamos algo, actualizamos esta página y la fecha del encabezado. Cuando el cambio sea
          relevante para ti, te lo avisaremos por correo o en el sitio antes de que empiece a regir.
        </p>
      </ProseBlock>
    </ContentPage>
  );
}
