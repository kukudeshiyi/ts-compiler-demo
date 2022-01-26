import ts from "typescript";

const EXPRESSION_NODE_ESCAPED_TEXT = "i18n";
const NAME_NODE_ESCAPED_TEXT = "t";
const ERROR_MSG_ONE =
  "The parameters of the i18n.t function are not completely static string literals and cannot be completely statically analyzed. Please check and add them manually";
const ERROR_MSG_TWO =
  "Existence of ternary expression non-static string literal, please check and add manually";

interface PluginParseReturnValueType {
  results: string[];
  errors: string[];
}
interface PluginType {
  isFit: (node: ts.Node, sourceFile: ts.SourceFile) => boolean;
  parse: (
    node: ts.Node,
    sourceFile: ts.SourceFile
  ) => PluginParseReturnValueType;
}

main(process.argv.slice(2), {
  // target: ts.ScriptTarget.ES5,
  // module: ts.ModuleKind.CommonJS,
  jsx: ts.JsxEmit.React,
});

function createErrorMessage(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  errorMessage: string
) {
  const { line, character } = ts.getLineAndCharacterOfPosition(
    sourceFile,
    node.getStart(sourceFile)
  );
  return `${sourceFile.fileName} (${line + 1},${
    character + 1
  }) ${errorMessage}`;
}

// i18n.t();
function parseI18nPointT(): PluginType {
  return {
    isFit: (node: ts.Node, sourceFile: ts.SourceFile) => {
      // 校验是否是 CallExpression
      // 校验 CallExpression 的 expression 的 name 和 expression 是不是 Identifier 以及 escapedText 是不是 t 和 i18n
      try {
        const isCallExpression = ts.isCallExpression(node);
        if (!isCallExpression) {
          return false;
        }

        const callExpressionExpressionNode = node.expression;
        const isPropertyAccessExpression = ts.isPropertyAccessExpression(
          callExpressionExpressionNode
        );
        if (!isPropertyAccessExpression) {
          return false;
        }

        const expressionNode = callExpressionExpressionNode.expression;
        const nameNode = callExpressionExpressionNode.name;
        const expressionNodeIsIdentifier = ts.isIdentifier(expressionNode);
        const nameNodeIsIdentifier = ts.isIdentifier(nameNode);
        if (!expressionNodeIsIdentifier || !nameNodeIsIdentifier) {
          return false;
        }

        if (
          expressionNode.escapedText !== EXPRESSION_NODE_ESCAPED_TEXT ||
          nameNode.escapedText !== NAME_NODE_ESCAPED_TEXT
        ) {
          return false;
        }

        return true;
      } catch (e) {
        return false;
      }
    },
    parse: (node: ts.Node, sourceFile: ts.SourceFile) => {
      // 已经在 isFit 中完全校验符合i18n.t()，现可直接获取参数进行校验
      // 校验参数是是不是字符字面量，如果是则直接提取字符字面量
      // 校验参数是不是三元表达式，如果是则提取两个结果中的字符字面量，如果存在不为字符字面量的节点，则要记录到错误日志中
      // 如果为其他节点则，直接记录到错误日志中，供用户手动检查
      try {
        const results: string[] = [];
        const errors: string[] = [];

        const callExpressionParams = (node as ts.CallExpression).arguments;
        const firstParamNode = callExpressionParams[0];

        if (ts.isStringLiteral(firstParamNode)) {
          results.push(firstParamNode.text);
        }

        if (ts.isConditionalExpression(firstParamNode)) {
          const trueResultNode = firstParamNode.whenTrue;
          const falseResultNode = firstParamNode.whenFalse;

          if (ts.isStringLiteral(trueResultNode)) {
            results.push(trueResultNode.text);
          } else {
            errors.push(createErrorMessage(node, sourceFile, ERROR_MSG_TWO));
          }

          if (ts.isStringLiteral(falseResultNode)) {
            results.push(falseResultNode.text);
          } else {
            errors.push(createErrorMessage(node, sourceFile, ERROR_MSG_TWO));
          }
        }

        if (results.length <= 0 && errors.length <= 0) {
          errors.push(createErrorMessage(node, sourceFile, ERROR_MSG_ONE));
        }

        return {
          results,
          errors,
        };
      } catch (e) {
        // console.log("e", e);
        return {
          results: [],
          errors: [],
        };
      }
    },
  };
}

function main(file: string[], options?: ts.CompilerOptions) {
  // 读取配置文件
  // 读取命令行参数
  // 读取目前的翻译文件
  // 注入插件
  // 创建 typescript program
  // 过滤掉不需要的 sourceFile，例如去掉类型声明文件、以及 node_modules 中的文件
  // 依次遍历 sourceFile 以及其中的每一个节点并调用插件进行转换

  const plugins = [parseI18nPointT].reduce(
    (pluginsArr: Array<PluginType>, pluginFactory: unknown) => {
      if (typeof pluginFactory === "function") {
        const plugin = pluginFactory();
        if (
          typeof plugin.isFit === "function" &&
          typeof plugin.parse === "function"
        ) {
          pluginsArr.push(plugin);
        }
      }
      return pluginsArr;
    },
    []
  );

  const program = ts.createProgram(file, options || {});
  const sourceFiles = program.getSourceFiles();
  const results: string[] = [];
  const errors: string[] = [];
  let currentSourceFile: ts.SourceFile | null = null;

  // 优化
  // 因为像 i.t 这种我们不能只根据节点来确认是用于翻译文案的
  // 所以就需要从引入来确认该文件确实用到了 i18n 来翻译文案
  // 这就需要在配置文件中写入 i18n 原模块地址，然后进行匹配确认
  // 所以，当需要遍历一个 sourceFile 的时候，通过先确认是否引入，来确定该插件在该文件中是否有用，从而对所有插件进行过滤
  // 若过滤之后没有符合要求的插件，则无需再去遍历该 sourceFile 中的节点

  sourceFiles.forEach((sourceFile) => {
    if (sourceFile.isDeclarationFile) {
      return;
    }
    currentSourceFile = sourceFile;
    ts.forEachChild(sourceFile, visit);
  });

  function visit(node: ts.Node) {
    plugins.forEach((plugin) => {
      const { isFit, parse } = plugin;
      if (currentSourceFile && isFit(node, currentSourceFile)) {
        const {
          results: singleNodeParseResults,
          errors: singleNodeParseErrors,
        } = parse(node, currentSourceFile);
        results.push(...singleNodeParseResults);
        errors.push(...singleNodeParseErrors);
      }
    });
    ts.forEachChild(node, visit);
  }

  // 去重
  const handleResults = [...new Set(results)];
  console.log("results:", handleResults);
  console.log("errors", errors);
}
