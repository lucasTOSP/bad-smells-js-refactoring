// Regras de negócio que antes eram "números mágicos" no meio do código.
const ADMIN_PRIORITY_THRESHOLD = 1000;
const USER_MAX_VISIBLE_VALUE = 500;

/**
 * Políticas de acesso por perfil (Replace Conditional with Polymorphism).
 * Cada perfil decide quais itens enxerga e quais são prioritários.
 */
const ROLE_POLICIES = {
  ADMIN: {
    canSee: () => true,
    isPriority: (item) => item.value > ADMIN_PRIORITY_THRESHOLD,
  },
  USER: {
    canSee: (item) => item.value <= USER_MAX_VISIBLE_VALUE,
    isPriority: () => false,
  },
};

// Perfis desconhecidos não veem nenhum item (mesmo comportamento do original).
const NO_ACCESS_POLICY = {
  canSee: () => false,
  isPriority: () => false,
};

/**
 * Formatadores por tipo de relatório (Replace Conditional with Polymorphism).
 * Todos expõem a mesma interface: header, row e footer, cada um devolvendo linhas.
 */
class CsvFormatter {
  header() {
    return ['ID,NOME,VALOR,USUARIO'];
  }

  row(item, user) {
    return `${item.id},${item.name},${item.value},${user.name}`;
  }

  footer(total) {
    return ['', 'Total,,', `${total},,`];
  }
}

class HtmlFormatter {
  header(user) {
    return [
      '<html><body>',
      '<h1>Relatório</h1>',
      `<h2>Usuário: ${user.name}</h2>`,
      '<table>',
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>',
    ];
  }

  row(item, user, isPriority) {
    const style = isPriority ? ' style="font-weight:bold;"' : '';
    return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>`;
  }

  footer(total) {
    return ['</table>', `<h3>Total: ${total}</h3>`, '</body></html>'];
  }
}

const FORMATTERS = {
  CSV: new CsvFormatter(),
  HTML: new HtmlFormatter(),
};

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo.
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    const formatter = FORMATTERS[reportType];
    if (!formatter) {
      return '';
    }

    const policy = this.getPolicyFor(user);
    const visibleItems = items.filter((item) => policy.canSee(item));
    const rows = visibleItems.map((item) => formatter.row(item, user, policy.isPriority(item)));
    const total = this.calculateTotal(visibleItems);

    return [...formatter.header(user), ...rows, ...formatter.footer(total)].join('\n').trim();
  }

  getPolicyFor(user) {
    return ROLE_POLICIES[user.role] ?? NO_ACCESS_POLICY;
  }

  calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.value, 0);
  }
}
