import { writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Rule } from './traverse-rules.js';
import { camelCase } from 'scule';

const __dirname = new URL('.', import.meta.url).pathname;

export enum RulesGrouping {
  CATEGORY = 'category',
  SCOPE = 'scope',
}

export type ResultMap = Map<string, string[]>;

export class RulesGenerator {
  private rulesGrouping: RulesGrouping;
  private rulesArray: Rule[];
  constructor(
    rulesArray: Rule[] = [],
    rulesGrouping: RulesGrouping = RulesGrouping.SCOPE
  ) {
    this.rulesArray = rulesArray;
    this.rulesGrouping = rulesGrouping;
  }

  public setRulesGrouping(rulesGrouping: RulesGrouping) {
    this.rulesGrouping = rulesGrouping;
  }

  private groupItemsBy(
    rules: Rule[],
    rulesGrouping: RulesGrouping
  ): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const item of rules) {
      const key = item[rulesGrouping];
      const group = map.get(key) || [];
      group.push(item.value);
      map.set(key, group);
    }

    return map;
  }

  public async generateRulesCode() {
    console.log(`Generating rules, grouped by ${this.rulesGrouping}`);

    const rulesGrouping = this.rulesGrouping;
    const rulesArray = this.rulesArray;

    const rulesMap = this.groupItemsBy(rulesArray, rulesGrouping);

    const exportGrouping: string[] = [];
    let code =
      '// hello - These rules are automatically generated by scripts/generate-rules.ts\n\n';

    for (const grouping of rulesMap.keys()) {
      exportGrouping.push(grouping);
      const rules = rulesMap.get(grouping);

      code += `const ${camelCase(grouping)}Rules = {\n`;

      code += rules
        ?.map((rule) => {
          return `  '${rule.replaceAll('_', '-')}': "off"`;
        })
        .join(',\n');
      code += '\n} as const;\n\n';
    }

    code += 'export {\n';
    code += exportGrouping
      .map((grouping) => {
        return `  ${grouping.replaceAll(/_(\w)/g, (_, c) => c.toUpperCase())}Rules`;
      })
      .join(',\n');
    code += '\n}';

    return code;
  }

  public async generateRules() {
    const output = await this.generateRulesCode();
    writeFileSync(
      path.resolve(__dirname, '..', `src/rules-by-${this.rulesGrouping}.ts`),
      output
    );
  }
}
