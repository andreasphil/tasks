import memize from "memize";
import {
  parse as baseParse,
  type Item,
  type ParserOpts,
} from "../lib/parser.ts";

function createAppParser() {
  let appOpts: ParserOpts = {};

  function parse(input: string): Item {
    return baseParse(input, appOpts);
  }

  parse.setOpts = (newOpts: ParserOpts) => {
    appOpts = newOpts;
    parse.withMemo.clear();
  };

  parse.withMemo = memize(parse);

  return parse;
}

export const parse = createAppParser();
