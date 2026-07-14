import Handlebars from "handlebars";

// Register helpers for common filters so AI-generated templates work
Handlebars.registerHelper("truncate", (str: unknown, len: number) => {
  const s = String(str ?? "");
  return s.length > len ? s.slice(0, len) + "..." : s;
});

Handlebars.registerHelper("upper", (str: unknown) =>
  String(str ?? "").toUpperCase(),
);
Handlebars.registerHelper("lower", (str: unknown) =>
  String(str ?? "").toLowerCase(),
);
Handlebars.registerHelper("trim", (str: unknown) => String(str ?? "").trim());
Handlebars.registerHelper("json", (val: unknown) =>
  JSON.stringify(val, null, 2),
);
Handlebars.registerHelper(
  "default",
  (val: unknown, def: unknown) => val ?? def,
);

/**
 * Sanitise a template string before handing it to Handlebars.
 * Converts unsupported Liquid/Jinja pipe filters like {{x|truncate:50}}
 * into valid Handlebars helper calls like {{truncate x 50}}.
 */
function sanitize(template: string): string {
  return (
    template
      // {{var|truncate:N}} → {{truncate var N}}
      .replace(/\{\{(\s*[\w.]+\s*)\|truncate:(\d+)\}\}/g, "{{truncate $1 $2}}")
      // {{var|upper}} → {{upper var}}
      .replace(/\{\{(\s*[\w.]+\s*)\|upper\}\}/g, "{{upper $1}}")
      // {{var|lower}} → {{lower var}}
      .replace(/\{\{(\s*[\w.]+\s*)\|lower\}\}/g, "{{lower $1}}")
      // {{var|trim}} → {{trim var}}
      .replace(/\{\{(\s*[\w.]+\s*)\|trim\}\}/g, "{{trim $1}}")
      // {{var|json}} → {{json var}}
      .replace(/\{\{(\s*[\w.]+\s*)\|json\}\}/g, "{{json $1}}")
      // strip any remaining unknown pipes to avoid parse errors
      .replace(/\{\{(\s*[\w.]+\s*)\|[^}]+\}\}/g, "{{{$1}}}")
  );
}

/**
 * Compile and render a Handlebars template safely.
 * Falls back to the raw template string on any error.
 */
export function renderTemplate(
  template: string,
  context: Record<string, unknown>,
): string {
  try {
    const safe = sanitize(template);
    return Handlebars.compile(safe)(context);
  } catch {
    try {
      // Last resort: strip all {{ }} and return plain text
      return template.replace(/\{\{[^}]*\}\}/g, "");
    } catch {
      return template;
    }
  }
}
