import { pathToFileURL as $i, fileURLToPath as ki } from "node:url";
import B from "node:path";
import { app as Xe, ipcMain as ke, protocol as vr, net as xi, BrowserWindow as br } from "electron";
import to from "@anthropic-ai/sdk";
import { execFile as _i } from "node:child_process";
import { promisify as Si } from "node:util";
import { existsSync as wr, mkdirSync as Ti, readdirSync as Ai, promises as he } from "node:fs";
import $r from "node:os";
import { access as Ii } from "node:fs/promises";
try {
  process.loadEnvFile();
} catch {
}
const dt = 4, sn = 300, Se = 6, kr = ["version", "id", "name", "screen", "mode", "root", "screens", "notes"], xr = ["id", "name", "screen", "mode", "root"], en = ["type", "props", "children", "anchor", "goTo"], D = "deviation", We = "reuse";
function _r(t, e) {
  return t !== "exploratory" ? en : typeof e == "string" && e.startsWith("primitive:") ? [...en, D, We] : [...en, D];
}
const Sr = "screen-1";
function zt(t) {
  return /^focus/i.test(t) ? "the engine reads focus off the rendered screen, so a Blueprint never declares it" : "the Blueprint DSL has no such key";
}
const an = {
  /** renderer -> main : ipcRenderer.invoke(IPC.generateUI, GenerateUIRequest) */
  generateUI: "ai:generateUI"
}, ct = "render_ui", Ei = ["auto", "faithful", "exploratory", "both"], Tr = ["faithful", "exploratory"];
function Ar(t, e = "faithful") {
  const n = typeof t == "object" && t !== null ? t.mode : void 0;
  return Tr.find((o) => o === n) ?? e;
}
const je = {
  /** main: return every persisted manifest (+ the built-in). */
  list: "ds:list",
  /** main: write `<id>.json` to the userData design-systems directory. */
  save: "ds:save",
  /** main: delete `<id>.json`. */
  delete: "ds:delete",
  /** main: read the remembered active manifest id. */
  getActive: "ds:getActive",
  /** main: persist the active manifest id. */
  setActive: "ds:setActive",
  /** main: write `<id>.bundle.js` (Phase 8A — only for an id with a manifest). */
  saveBundle: "ds:saveBundle",
  /** main: whether `<id>.bundle.js` exists. */
  hasBundle: "ds:hasBundle"
};
var P;
(function(t) {
  t.assertEqual = (r) => {
  };
  function e(r) {
  }
  t.assertIs = e;
  function n(r) {
    throw new Error();
  }
  t.assertNever = n, t.arrayToEnum = (r) => {
    const s = {};
    for (const i of r)
      s[i] = i;
    return s;
  }, t.getValidEnumValues = (r) => {
    const s = t.objectKeys(r).filter((a) => typeof r[r[a]] != "number"), i = {};
    for (const a of s)
      i[a] = r[a];
    return t.objectValues(i);
  }, t.objectValues = (r) => t.objectKeys(r).map(function(s) {
    return r[s];
  }), t.objectKeys = typeof Object.keys == "function" ? (r) => Object.keys(r) : (r) => {
    const s = [];
    for (const i in r)
      Object.prototype.hasOwnProperty.call(r, i) && s.push(i);
    return s;
  }, t.find = (r, s) => {
    for (const i of r)
      if (s(i))
        return i;
  }, t.isInteger = typeof Number.isInteger == "function" ? (r) => Number.isInteger(r) : (r) => typeof r == "number" && Number.isFinite(r) && Math.floor(r) === r;
  function o(r, s = " | ") {
    return r.map((i) => typeof i == "string" ? `'${i}'` : i).join(s);
  }
  t.joinValues = o, t.jsonStringifyReplacer = (r, s) => typeof s == "bigint" ? s.toString() : s;
})(P || (P = {}));
var no;
(function(t) {
  t.mergeShapes = (e, n) => ({
    ...e,
    ...n
    // second overwrites first
  });
})(no || (no = {}));
const k = P.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]), xe = (t) => {
  switch (typeof t) {
    case "undefined":
      return k.undefined;
    case "string":
      return k.string;
    case "number":
      return Number.isNaN(t) ? k.nan : k.number;
    case "boolean":
      return k.boolean;
    case "function":
      return k.function;
    case "bigint":
      return k.bigint;
    case "symbol":
      return k.symbol;
    case "object":
      return Array.isArray(t) ? k.array : t === null ? k.null : t.then && typeof t.then == "function" && t.catch && typeof t.catch == "function" ? k.promise : typeof Map < "u" && t instanceof Map ? k.map : typeof Set < "u" && t instanceof Set ? k.set : typeof Date < "u" && t instanceof Date ? k.date : k.object;
    default:
      return k.unknown;
  }
}, v = P.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
class be extends Error {
  get errors() {
    return this.issues;
  }
  constructor(e) {
    super(), this.issues = [], this.addIssue = (o) => {
      this.issues = [...this.issues, o];
    }, this.addIssues = (o = []) => {
      this.issues = [...this.issues, ...o];
    };
    const n = new.target.prototype;
    Object.setPrototypeOf ? Object.setPrototypeOf(this, n) : this.__proto__ = n, this.name = "ZodError", this.issues = e;
  }
  format(e) {
    const n = e || function(s) {
      return s.message;
    }, o = { _errors: [] }, r = (s) => {
      for (const i of s.issues)
        if (i.code === "invalid_union")
          i.unionErrors.map(r);
        else if (i.code === "invalid_return_type")
          r(i.returnTypeError);
        else if (i.code === "invalid_arguments")
          r(i.argumentsError);
        else if (i.path.length === 0)
          o._errors.push(n(i));
        else {
          let a = o, l = 0;
          for (; l < i.path.length; ) {
            const c = i.path[l];
            l === i.path.length - 1 ? (a[c] = a[c] || { _errors: [] }, a[c]._errors.push(n(i))) : a[c] = a[c] || { _errors: [] }, a = a[c], l++;
          }
        }
    };
    return r(this), o;
  }
  static assert(e) {
    if (!(e instanceof be))
      throw new Error(`Not a ZodError: ${e}`);
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, P.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(e = (n) => n.message) {
    const n = {}, o = [];
    for (const r of this.issues)
      if (r.path.length > 0) {
        const s = r.path[0];
        n[s] = n[s] || [], n[s].push(e(r));
      } else
        o.push(e(r));
    return { formErrors: o, fieldErrors: n };
  }
  get formErrors() {
    return this.flatten();
  }
}
be.create = (t) => new be(t);
const ln = (t, e) => {
  let n;
  switch (t.code) {
    case v.invalid_type:
      t.received === k.undefined ? n = "Required" : n = `Expected ${t.expected}, received ${t.received}`;
      break;
    case v.invalid_literal:
      n = `Invalid literal value, expected ${JSON.stringify(t.expected, P.jsonStringifyReplacer)}`;
      break;
    case v.unrecognized_keys:
      n = `Unrecognized key(s) in object: ${P.joinValues(t.keys, ", ")}`;
      break;
    case v.invalid_union:
      n = "Invalid input";
      break;
    case v.invalid_union_discriminator:
      n = `Invalid discriminator value. Expected ${P.joinValues(t.options)}`;
      break;
    case v.invalid_enum_value:
      n = `Invalid enum value. Expected ${P.joinValues(t.options)}, received '${t.received}'`;
      break;
    case v.invalid_arguments:
      n = "Invalid function arguments";
      break;
    case v.invalid_return_type:
      n = "Invalid function return type";
      break;
    case v.invalid_date:
      n = "Invalid date";
      break;
    case v.invalid_string:
      typeof t.validation == "object" ? "includes" in t.validation ? (n = `Invalid input: must include "${t.validation.includes}"`, typeof t.validation.position == "number" && (n = `${n} at one or more positions greater than or equal to ${t.validation.position}`)) : "startsWith" in t.validation ? n = `Invalid input: must start with "${t.validation.startsWith}"` : "endsWith" in t.validation ? n = `Invalid input: must end with "${t.validation.endsWith}"` : P.assertNever(t.validation) : t.validation !== "regex" ? n = `Invalid ${t.validation}` : n = "Invalid";
      break;
    case v.too_small:
      t.type === "array" ? n = `Array must contain ${t.exact ? "exactly" : t.inclusive ? "at least" : "more than"} ${t.minimum} element(s)` : t.type === "string" ? n = `String must contain ${t.exact ? "exactly" : t.inclusive ? "at least" : "over"} ${t.minimum} character(s)` : t.type === "number" ? n = `Number must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${t.minimum}` : t.type === "bigint" ? n = `Number must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${t.minimum}` : t.type === "date" ? n = `Date must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(t.minimum))}` : n = "Invalid input";
      break;
    case v.too_big:
      t.type === "array" ? n = `Array must contain ${t.exact ? "exactly" : t.inclusive ? "at most" : "less than"} ${t.maximum} element(s)` : t.type === "string" ? n = `String must contain ${t.exact ? "exactly" : t.inclusive ? "at most" : "under"} ${t.maximum} character(s)` : t.type === "number" ? n = `Number must be ${t.exact ? "exactly" : t.inclusive ? "less than or equal to" : "less than"} ${t.maximum}` : t.type === "bigint" ? n = `BigInt must be ${t.exact ? "exactly" : t.inclusive ? "less than or equal to" : "less than"} ${t.maximum}` : t.type === "date" ? n = `Date must be ${t.exact ? "exactly" : t.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(t.maximum))}` : n = "Invalid input";
      break;
    case v.custom:
      n = "Invalid input";
      break;
    case v.invalid_intersection_types:
      n = "Intersection results could not be merged";
      break;
    case v.not_multiple_of:
      n = `Number must be a multiple of ${t.multipleOf}`;
      break;
    case v.not_finite:
      n = "Number must be finite";
      break;
    default:
      n = e.defaultError, P.assertNever(t);
  }
  return { message: n };
};
let Oi = ln;
function Ci() {
  return Oi;
}
const Ni = (t) => {
  const { data: e, path: n, errorMaps: o, issueData: r } = t, s = [...n, ...r.path || []], i = {
    ...r,
    path: s
  };
  if (r.message !== void 0)
    return {
      ...r,
      path: s,
      message: r.message
    };
  let a = "";
  const l = o.filter((c) => !!c).slice().reverse();
  for (const c of l)
    a = c(i, { data: e, defaultError: a }).message;
  return {
    ...r,
    path: s,
    message: a
  };
};
function $(t, e) {
  const n = Ci(), o = Ni({
    issueData: e,
    data: t.data,
    path: t.path,
    errorMaps: [
      t.common.contextualErrorMap,
      // contextual error map is first priority
      t.schemaErrorMap,
      // then schema-bound map if available
      n,
      // then global override map
      n === ln ? void 0 : ln
      // then global default map
    ].filter((r) => !!r)
  });
  t.common.issues.push(o);
}
class Y {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    this.value === "valid" && (this.value = "dirty");
  }
  abort() {
    this.value !== "aborted" && (this.value = "aborted");
  }
  static mergeArray(e, n) {
    const o = [];
    for (const r of n) {
      if (r.status === "aborted")
        return A;
      r.status === "dirty" && e.dirty(), o.push(r.value);
    }
    return { status: e.value, value: o };
  }
  static async mergeObjectAsync(e, n) {
    const o = [];
    for (const r of n) {
      const s = await r.key, i = await r.value;
      o.push({
        key: s,
        value: i
      });
    }
    return Y.mergeObjectSync(e, o);
  }
  static mergeObjectSync(e, n) {
    const o = {};
    for (const r of n) {
      const { key: s, value: i } = r;
      if (s.status === "aborted" || i.status === "aborted")
        return A;
      s.status === "dirty" && e.dirty(), i.status === "dirty" && e.dirty(), s.value !== "__proto__" && (typeof i.value < "u" || r.alwaysSet) && (o[s.value] = i.value);
    }
    return { status: e.value, value: o };
  }
}
const A = Object.freeze({
  status: "aborted"
}), lt = (t) => ({ status: "dirty", value: t }), re = (t) => ({ status: "valid", value: t }), oo = (t) => t.status === "aborted", ro = (t) => t.status === "dirty", Qe = (t) => t.status === "valid", jt = (t) => typeof Promise < "u" && t instanceof Promise;
var x;
(function(t) {
  t.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, t.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
})(x || (x = {}));
class pe {
  constructor(e, n, o, r) {
    this._cachedPath = [], this.parent = e, this.data = n, this._path = o, this._key = r;
  }
  get path() {
    return this._cachedPath.length || (Array.isArray(this._key) ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const so = (t, e) => {
  if (Qe(e))
    return { success: !0, data: e.value };
  if (!t.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: !1,
    get error() {
      if (this._error)
        return this._error;
      const n = new be(t.common.issues);
      return this._error = n, this._error;
    }
  };
};
function O(t) {
  if (!t)
    return {};
  const { errorMap: e, invalid_type_error: n, required_error: o, description: r } = t;
  if (e && (n || o))
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  return e ? { errorMap: e, description: r } : { errorMap: (i, a) => {
    const { message: l } = t;
    return i.code === "invalid_enum_value" ? { message: l ?? a.defaultError } : typeof a.data > "u" ? { message: l ?? o ?? a.defaultError } : i.code !== "invalid_type" ? { message: a.defaultError } : { message: l ?? n ?? a.defaultError };
  }, description: r };
}
class j {
  get description() {
    return this._def.description;
  }
  _getType(e) {
    return xe(e.data);
  }
  _getOrReturnCtx(e, n) {
    return n || {
      common: e.parent.common,
      data: e.data,
      parsedType: xe(e.data),
      schemaErrorMap: this._def.errorMap,
      path: e.path,
      parent: e.parent
    };
  }
  _processInputParams(e) {
    return {
      status: new Y(),
      ctx: {
        common: e.parent.common,
        data: e.data,
        parsedType: xe(e.data),
        schemaErrorMap: this._def.errorMap,
        path: e.path,
        parent: e.parent
      }
    };
  }
  _parseSync(e) {
    const n = this._parse(e);
    if (jt(n))
      throw new Error("Synchronous parse encountered promise.");
    return n;
  }
  _parseAsync(e) {
    const n = this._parse(e);
    return Promise.resolve(n);
  }
  parse(e, n) {
    const o = this.safeParse(e, n);
    if (o.success)
      return o.data;
    throw o.error;
  }
  safeParse(e, n) {
    const o = {
      common: {
        issues: [],
        async: (n == null ? void 0 : n.async) ?? !1,
        contextualErrorMap: n == null ? void 0 : n.errorMap
      },
      path: (n == null ? void 0 : n.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: xe(e)
    }, r = this._parseSync({ data: e, path: o.path, parent: o });
    return so(o, r);
  }
  "~validate"(e) {
    var o, r;
    const n = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: xe(e)
    };
    if (!this["~standard"].async)
      try {
        const s = this._parseSync({ data: e, path: [], parent: n });
        return Qe(s) ? {
          value: s.value
        } : {
          issues: n.common.issues
        };
      } catch (s) {
        (r = (o = s == null ? void 0 : s.message) == null ? void 0 : o.toLowerCase()) != null && r.includes("encountered") && (this["~standard"].async = !0), n.common = {
          issues: [],
          async: !0
        };
      }
    return this._parseAsync({ data: e, path: [], parent: n }).then((s) => Qe(s) ? {
      value: s.value
    } : {
      issues: n.common.issues
    });
  }
  async parseAsync(e, n) {
    const o = await this.safeParseAsync(e, n);
    if (o.success)
      return o.data;
    throw o.error;
  }
  async safeParseAsync(e, n) {
    const o = {
      common: {
        issues: [],
        contextualErrorMap: n == null ? void 0 : n.errorMap,
        async: !0
      },
      path: (n == null ? void 0 : n.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: xe(e)
    }, r = this._parse({ data: e, path: o.path, parent: o }), s = await (jt(r) ? r : Promise.resolve(r));
    return so(o, s);
  }
  refine(e, n) {
    const o = (r) => typeof n == "string" || typeof n > "u" ? { message: n } : typeof n == "function" ? n(r) : n;
    return this._refinement((r, s) => {
      const i = e(r), a = () => s.addIssue({
        code: v.custom,
        ...o(r)
      });
      return typeof Promise < "u" && i instanceof Promise ? i.then((l) => l ? !0 : (a(), !1)) : i ? !0 : (a(), !1);
    });
  }
  refinement(e, n) {
    return this._refinement((o, r) => e(o) ? !0 : (r.addIssue(typeof n == "function" ? n(o, r) : n), !1));
  }
  _refinement(e) {
    return new nt({
      schema: this,
      typeName: T.ZodEffects,
      effect: { type: "refinement", refinement: e }
    });
  }
  superRefine(e) {
    return this._refinement(e);
  }
  constructor(e) {
    this.spa = this.safeParseAsync, this._def = e, this.parse = this.parse.bind(this), this.safeParse = this.safeParse.bind(this), this.parseAsync = this.parseAsync.bind(this), this.safeParseAsync = this.safeParseAsync.bind(this), this.spa = this.spa.bind(this), this.refine = this.refine.bind(this), this.refinement = this.refinement.bind(this), this.superRefine = this.superRefine.bind(this), this.optional = this.optional.bind(this), this.nullable = this.nullable.bind(this), this.nullish = this.nullish.bind(this), this.array = this.array.bind(this), this.promise = this.promise.bind(this), this.or = this.or.bind(this), this.and = this.and.bind(this), this.transform = this.transform.bind(this), this.brand = this.brand.bind(this), this.default = this.default.bind(this), this.catch = this.catch.bind(this), this.describe = this.describe.bind(this), this.pipe = this.pipe.bind(this), this.readonly = this.readonly.bind(this), this.isNullable = this.isNullable.bind(this), this.isOptional = this.isOptional.bind(this), this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (n) => this["~validate"](n)
    };
  }
  optional() {
    return Te.create(this, this._def);
  }
  nullable() {
    return ot.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return se.create(this);
  }
  promise() {
    return Bt.create(this, this._def);
  }
  or(e) {
    return Pt.create([this, e], this._def);
  }
  and(e) {
    return Lt.create(this, e, this._def);
  }
  transform(e) {
    return new nt({
      ...O(this._def),
      schema: this,
      typeName: T.ZodEffects,
      effect: { type: "transform", transform: e }
    });
  }
  default(e) {
    const n = typeof e == "function" ? e : () => e;
    return new Dt({
      ...O(this._def),
      innerType: this,
      defaultValue: n,
      typeName: T.ZodDefault
    });
  }
  brand() {
    return new ta({
      typeName: T.ZodBranded,
      type: this,
      ...O(this._def)
    });
  }
  catch(e) {
    const n = typeof e == "function" ? e : () => e;
    return new fn({
      ...O(this._def),
      innerType: this,
      catchValue: n,
      typeName: T.ZodCatch
    });
  }
  describe(e) {
    const n = this.constructor;
    return new n({
      ...this._def,
      description: e
    });
  }
  pipe(e) {
    return Cn.create(this, e);
  }
  readonly() {
    return mn.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const ji = /^c[^\s-]{8,}$/i, Ri = /^[0-9a-z]+$/, Pi = /^[0-9A-HJKMNP-TV-Z]{26}$/i, Li = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, Mi = /^[a-z0-9_-]{21}$/i, Bi = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, Di = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, Fi = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, Vi = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
let tn;
const qi = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, Ui = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, Zi = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, zi = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, Hi = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, Ji = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, Ir = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", Wi = new RegExp(`^${Ir}$`);
function Er(t) {
  let e = "[0-5]\\d";
  t.precision ? e = `${e}\\.\\d{${t.precision}}` : t.precision == null && (e = `${e}(\\.\\d+)?`);
  const n = t.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${e})${n}`;
}
function Gi(t) {
  return new RegExp(`^${Er(t)}$`);
}
function Yi(t) {
  let e = `${Ir}T${Er(t)}`;
  const n = [];
  return n.push(t.local ? "Z?" : "Z"), t.offset && n.push("([+-]\\d{2}:?\\d{2})"), e = `${e}(${n.join("|")})`, new RegExp(`^${e}$`);
}
function Ki(t, e) {
  return !!((e === "v4" || !e) && qi.test(t) || (e === "v6" || !e) && Zi.test(t));
}
function Xi(t, e) {
  if (!Bi.test(t))
    return !1;
  try {
    const [n] = t.split(".");
    if (!n)
      return !1;
    const o = n.replace(/-/g, "+").replace(/_/g, "/").padEnd(n.length + (4 - n.length % 4) % 4, "="), r = JSON.parse(atob(o));
    return !(typeof r != "object" || r === null || "typ" in r && (r == null ? void 0 : r.typ) !== "JWT" || !r.alg || e && r.alg !== e);
  } catch {
    return !1;
  }
}
function Qi(t, e) {
  return !!((e === "v4" || !e) && Ui.test(t) || (e === "v6" || !e) && zi.test(t));
}
class ge extends j {
  _parse(e) {
    if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== k.string) {
      const s = this._getOrReturnCtx(e);
      return $(s, {
        code: v.invalid_type,
        expected: k.string,
        received: s.parsedType
      }), A;
    }
    const o = new Y();
    let r;
    for (const s of this._def.checks)
      if (s.kind === "min")
        e.data.length < s.value && (r = this._getOrReturnCtx(e, r), $(r, {
          code: v.too_small,
          minimum: s.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: s.message
        }), o.dirty());
      else if (s.kind === "max")
        e.data.length > s.value && (r = this._getOrReturnCtx(e, r), $(r, {
          code: v.too_big,
          maximum: s.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: s.message
        }), o.dirty());
      else if (s.kind === "length") {
        const i = e.data.length > s.value, a = e.data.length < s.value;
        (i || a) && (r = this._getOrReturnCtx(e, r), i ? $(r, {
          code: v.too_big,
          maximum: s.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: s.message
        }) : a && $(r, {
          code: v.too_small,
          minimum: s.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: s.message
        }), o.dirty());
      } else if (s.kind === "email")
        Fi.test(e.data) || (r = this._getOrReturnCtx(e, r), $(r, {
          validation: "email",
          code: v.invalid_string,
          message: s.message
        }), o.dirty());
      else if (s.kind === "emoji")
        tn || (tn = new RegExp(Vi, "u")), tn.test(e.data) || (r = this._getOrReturnCtx(e, r), $(r, {
          validation: "emoji",
          code: v.invalid_string,
          message: s.message
        }), o.dirty());
      else if (s.kind === "uuid")
        Li.test(e.data) || (r = this._getOrReturnCtx(e, r), $(r, {
          validation: "uuid",
          code: v.invalid_string,
          message: s.message
        }), o.dirty());
      else if (s.kind === "nanoid")
        Mi.test(e.data) || (r = this._getOrReturnCtx(e, r), $(r, {
          validation: "nanoid",
          code: v.invalid_string,
          message: s.message
        }), o.dirty());
      else if (s.kind === "cuid")
        ji.test(e.data) || (r = this._getOrReturnCtx(e, r), $(r, {
          validation: "cuid",
          code: v.invalid_string,
          message: s.message
        }), o.dirty());
      else if (s.kind === "cuid2")
        Ri.test(e.data) || (r = this._getOrReturnCtx(e, r), $(r, {
          validation: "cuid2",
          code: v.invalid_string,
          message: s.message
        }), o.dirty());
      else if (s.kind === "ulid")
        Pi.test(e.data) || (r = this._getOrReturnCtx(e, r), $(r, {
          validation: "ulid",
          code: v.invalid_string,
          message: s.message
        }), o.dirty());
      else if (s.kind === "url")
        try {
          new URL(e.data);
        } catch {
          r = this._getOrReturnCtx(e, r), $(r, {
            validation: "url",
            code: v.invalid_string,
            message: s.message
          }), o.dirty();
        }
      else s.kind === "regex" ? (s.regex.lastIndex = 0, s.regex.test(e.data) || (r = this._getOrReturnCtx(e, r), $(r, {
        validation: "regex",
        code: v.invalid_string,
        message: s.message
      }), o.dirty())) : s.kind === "trim" ? e.data = e.data.trim() : s.kind === "includes" ? e.data.includes(s.value, s.position) || (r = this._getOrReturnCtx(e, r), $(r, {
        code: v.invalid_string,
        validation: { includes: s.value, position: s.position },
        message: s.message
      }), o.dirty()) : s.kind === "toLowerCase" ? e.data = e.data.toLowerCase() : s.kind === "toUpperCase" ? e.data = e.data.toUpperCase() : s.kind === "startsWith" ? e.data.startsWith(s.value) || (r = this._getOrReturnCtx(e, r), $(r, {
        code: v.invalid_string,
        validation: { startsWith: s.value },
        message: s.message
      }), o.dirty()) : s.kind === "endsWith" ? e.data.endsWith(s.value) || (r = this._getOrReturnCtx(e, r), $(r, {
        code: v.invalid_string,
        validation: { endsWith: s.value },
        message: s.message
      }), o.dirty()) : s.kind === "datetime" ? Yi(s).test(e.data) || (r = this._getOrReturnCtx(e, r), $(r, {
        code: v.invalid_string,
        validation: "datetime",
        message: s.message
      }), o.dirty()) : s.kind === "date" ? Wi.test(e.data) || (r = this._getOrReturnCtx(e, r), $(r, {
        code: v.invalid_string,
        validation: "date",
        message: s.message
      }), o.dirty()) : s.kind === "time" ? Gi(s).test(e.data) || (r = this._getOrReturnCtx(e, r), $(r, {
        code: v.invalid_string,
        validation: "time",
        message: s.message
      }), o.dirty()) : s.kind === "duration" ? Di.test(e.data) || (r = this._getOrReturnCtx(e, r), $(r, {
        validation: "duration",
        code: v.invalid_string,
        message: s.message
      }), o.dirty()) : s.kind === "ip" ? Ki(e.data, s.version) || (r = this._getOrReturnCtx(e, r), $(r, {
        validation: "ip",
        code: v.invalid_string,
        message: s.message
      }), o.dirty()) : s.kind === "jwt" ? Xi(e.data, s.alg) || (r = this._getOrReturnCtx(e, r), $(r, {
        validation: "jwt",
        code: v.invalid_string,
        message: s.message
      }), o.dirty()) : s.kind === "cidr" ? Qi(e.data, s.version) || (r = this._getOrReturnCtx(e, r), $(r, {
        validation: "cidr",
        code: v.invalid_string,
        message: s.message
      }), o.dirty()) : s.kind === "base64" ? Hi.test(e.data) || (r = this._getOrReturnCtx(e, r), $(r, {
        validation: "base64",
        code: v.invalid_string,
        message: s.message
      }), o.dirty()) : s.kind === "base64url" ? Ji.test(e.data) || (r = this._getOrReturnCtx(e, r), $(r, {
        validation: "base64url",
        code: v.invalid_string,
        message: s.message
      }), o.dirty()) : P.assertNever(s);
    return { status: o.value, value: e.data };
  }
  _regex(e, n, o) {
    return this.refinement((r) => e.test(r), {
      validation: n,
      code: v.invalid_string,
      ...x.errToObj(o)
    });
  }
  _addCheck(e) {
    return new ge({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  email(e) {
    return this._addCheck({ kind: "email", ...x.errToObj(e) });
  }
  url(e) {
    return this._addCheck({ kind: "url", ...x.errToObj(e) });
  }
  emoji(e) {
    return this._addCheck({ kind: "emoji", ...x.errToObj(e) });
  }
  uuid(e) {
    return this._addCheck({ kind: "uuid", ...x.errToObj(e) });
  }
  nanoid(e) {
    return this._addCheck({ kind: "nanoid", ...x.errToObj(e) });
  }
  cuid(e) {
    return this._addCheck({ kind: "cuid", ...x.errToObj(e) });
  }
  cuid2(e) {
    return this._addCheck({ kind: "cuid2", ...x.errToObj(e) });
  }
  ulid(e) {
    return this._addCheck({ kind: "ulid", ...x.errToObj(e) });
  }
  base64(e) {
    return this._addCheck({ kind: "base64", ...x.errToObj(e) });
  }
  base64url(e) {
    return this._addCheck({
      kind: "base64url",
      ...x.errToObj(e)
    });
  }
  jwt(e) {
    return this._addCheck({ kind: "jwt", ...x.errToObj(e) });
  }
  ip(e) {
    return this._addCheck({ kind: "ip", ...x.errToObj(e) });
  }
  cidr(e) {
    return this._addCheck({ kind: "cidr", ...x.errToObj(e) });
  }
  datetime(e) {
    return typeof e == "string" ? this._addCheck({
      kind: "datetime",
      precision: null,
      offset: !1,
      local: !1,
      message: e
    }) : this._addCheck({
      kind: "datetime",
      precision: typeof (e == null ? void 0 : e.precision) > "u" ? null : e == null ? void 0 : e.precision,
      offset: (e == null ? void 0 : e.offset) ?? !1,
      local: (e == null ? void 0 : e.local) ?? !1,
      ...x.errToObj(e == null ? void 0 : e.message)
    });
  }
  date(e) {
    return this._addCheck({ kind: "date", message: e });
  }
  time(e) {
    return typeof e == "string" ? this._addCheck({
      kind: "time",
      precision: null,
      message: e
    }) : this._addCheck({
      kind: "time",
      precision: typeof (e == null ? void 0 : e.precision) > "u" ? null : e == null ? void 0 : e.precision,
      ...x.errToObj(e == null ? void 0 : e.message)
    });
  }
  duration(e) {
    return this._addCheck({ kind: "duration", ...x.errToObj(e) });
  }
  regex(e, n) {
    return this._addCheck({
      kind: "regex",
      regex: e,
      ...x.errToObj(n)
    });
  }
  includes(e, n) {
    return this._addCheck({
      kind: "includes",
      value: e,
      position: n == null ? void 0 : n.position,
      ...x.errToObj(n == null ? void 0 : n.message)
    });
  }
  startsWith(e, n) {
    return this._addCheck({
      kind: "startsWith",
      value: e,
      ...x.errToObj(n)
    });
  }
  endsWith(e, n) {
    return this._addCheck({
      kind: "endsWith",
      value: e,
      ...x.errToObj(n)
    });
  }
  min(e, n) {
    return this._addCheck({
      kind: "min",
      value: e,
      ...x.errToObj(n)
    });
  }
  max(e, n) {
    return this._addCheck({
      kind: "max",
      value: e,
      ...x.errToObj(n)
    });
  }
  length(e, n) {
    return this._addCheck({
      kind: "length",
      value: e,
      ...x.errToObj(n)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(e) {
    return this.min(1, x.errToObj(e));
  }
  trim() {
    return new ge({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new ge({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new ge({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((e) => e.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((e) => e.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((e) => e.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((e) => e.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((e) => e.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((e) => e.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((e) => e.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((e) => e.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((e) => e.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((e) => e.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((e) => e.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((e) => e.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((e) => e.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((e) => e.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((e) => e.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((e) => e.kind === "base64url");
  }
  get minLength() {
    let e = null;
    for (const n of this._def.checks)
      n.kind === "min" && (e === null || n.value > e) && (e = n.value);
    return e;
  }
  get maxLength() {
    let e = null;
    for (const n of this._def.checks)
      n.kind === "max" && (e === null || n.value < e) && (e = n.value);
    return e;
  }
}
ge.create = (t) => new ge({
  checks: [],
  typeName: T.ZodString,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...O(t)
});
function ea(t, e) {
  const n = (t.toString().split(".")[1] || "").length, o = (e.toString().split(".")[1] || "").length, r = n > o ? n : o, s = Number.parseInt(t.toFixed(r).replace(".", "")), i = Number.parseInt(e.toFixed(r).replace(".", ""));
  return s % i / 10 ** r;
}
class et extends j {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
  }
  _parse(e) {
    if (this._def.coerce && (e.data = Number(e.data)), this._getType(e) !== k.number) {
      const s = this._getOrReturnCtx(e);
      return $(s, {
        code: v.invalid_type,
        expected: k.number,
        received: s.parsedType
      }), A;
    }
    let o;
    const r = new Y();
    for (const s of this._def.checks)
      s.kind === "int" ? P.isInteger(e.data) || (o = this._getOrReturnCtx(e, o), $(o, {
        code: v.invalid_type,
        expected: "integer",
        received: "float",
        message: s.message
      }), r.dirty()) : s.kind === "min" ? (s.inclusive ? e.data < s.value : e.data <= s.value) && (o = this._getOrReturnCtx(e, o), $(o, {
        code: v.too_small,
        minimum: s.value,
        type: "number",
        inclusive: s.inclusive,
        exact: !1,
        message: s.message
      }), r.dirty()) : s.kind === "max" ? (s.inclusive ? e.data > s.value : e.data >= s.value) && (o = this._getOrReturnCtx(e, o), $(o, {
        code: v.too_big,
        maximum: s.value,
        type: "number",
        inclusive: s.inclusive,
        exact: !1,
        message: s.message
      }), r.dirty()) : s.kind === "multipleOf" ? ea(e.data, s.value) !== 0 && (o = this._getOrReturnCtx(e, o), $(o, {
        code: v.not_multiple_of,
        multipleOf: s.value,
        message: s.message
      }), r.dirty()) : s.kind === "finite" ? Number.isFinite(e.data) || (o = this._getOrReturnCtx(e, o), $(o, {
        code: v.not_finite,
        message: s.message
      }), r.dirty()) : P.assertNever(s);
    return { status: r.value, value: e.data };
  }
  gte(e, n) {
    return this.setLimit("min", e, !0, x.toString(n));
  }
  gt(e, n) {
    return this.setLimit("min", e, !1, x.toString(n));
  }
  lte(e, n) {
    return this.setLimit("max", e, !0, x.toString(n));
  }
  lt(e, n) {
    return this.setLimit("max", e, !1, x.toString(n));
  }
  setLimit(e, n, o, r) {
    return new et({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: n,
          inclusive: o,
          message: x.toString(r)
        }
      ]
    });
  }
  _addCheck(e) {
    return new et({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  int(e) {
    return this._addCheck({
      kind: "int",
      message: x.toString(e)
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !1,
      message: x.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !1,
      message: x.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !0,
      message: x.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !0,
      message: x.toString(e)
    });
  }
  multipleOf(e, n) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: x.toString(n)
    });
  }
  finite(e) {
    return this._addCheck({
      kind: "finite",
      message: x.toString(e)
    });
  }
  safe(e) {
    return this._addCheck({
      kind: "min",
      inclusive: !0,
      value: Number.MIN_SAFE_INTEGER,
      message: x.toString(e)
    })._addCheck({
      kind: "max",
      inclusive: !0,
      value: Number.MAX_SAFE_INTEGER,
      message: x.toString(e)
    });
  }
  get minValue() {
    let e = null;
    for (const n of this._def.checks)
      n.kind === "min" && (e === null || n.value > e) && (e = n.value);
    return e;
  }
  get maxValue() {
    let e = null;
    for (const n of this._def.checks)
      n.kind === "max" && (e === null || n.value < e) && (e = n.value);
    return e;
  }
  get isInt() {
    return !!this._def.checks.find((e) => e.kind === "int" || e.kind === "multipleOf" && P.isInteger(e.value));
  }
  get isFinite() {
    let e = null, n = null;
    for (const o of this._def.checks) {
      if (o.kind === "finite" || o.kind === "int" || o.kind === "multipleOf")
        return !0;
      o.kind === "min" ? (n === null || o.value > n) && (n = o.value) : o.kind === "max" && (e === null || o.value < e) && (e = o.value);
    }
    return Number.isFinite(n) && Number.isFinite(e);
  }
}
et.create = (t) => new et({
  checks: [],
  typeName: T.ZodNumber,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...O(t)
});
class ut extends j {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte;
  }
  _parse(e) {
    if (this._def.coerce)
      try {
        e.data = BigInt(e.data);
      } catch {
        return this._getInvalidInput(e);
      }
    if (this._getType(e) !== k.bigint)
      return this._getInvalidInput(e);
    let o;
    const r = new Y();
    for (const s of this._def.checks)
      s.kind === "min" ? (s.inclusive ? e.data < s.value : e.data <= s.value) && (o = this._getOrReturnCtx(e, o), $(o, {
        code: v.too_small,
        type: "bigint",
        minimum: s.value,
        inclusive: s.inclusive,
        message: s.message
      }), r.dirty()) : s.kind === "max" ? (s.inclusive ? e.data > s.value : e.data >= s.value) && (o = this._getOrReturnCtx(e, o), $(o, {
        code: v.too_big,
        type: "bigint",
        maximum: s.value,
        inclusive: s.inclusive,
        message: s.message
      }), r.dirty()) : s.kind === "multipleOf" ? e.data % s.value !== BigInt(0) && (o = this._getOrReturnCtx(e, o), $(o, {
        code: v.not_multiple_of,
        multipleOf: s.value,
        message: s.message
      }), r.dirty()) : P.assertNever(s);
    return { status: r.value, value: e.data };
  }
  _getInvalidInput(e) {
    const n = this._getOrReturnCtx(e);
    return $(n, {
      code: v.invalid_type,
      expected: k.bigint,
      received: n.parsedType
    }), A;
  }
  gte(e, n) {
    return this.setLimit("min", e, !0, x.toString(n));
  }
  gt(e, n) {
    return this.setLimit("min", e, !1, x.toString(n));
  }
  lte(e, n) {
    return this.setLimit("max", e, !0, x.toString(n));
  }
  lt(e, n) {
    return this.setLimit("max", e, !1, x.toString(n));
  }
  setLimit(e, n, o, r) {
    return new ut({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: n,
          inclusive: o,
          message: x.toString(r)
        }
      ]
    });
  }
  _addCheck(e) {
    return new ut({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !1,
      message: x.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !1,
      message: x.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !0,
      message: x.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !0,
      message: x.toString(e)
    });
  }
  multipleOf(e, n) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: x.toString(n)
    });
  }
  get minValue() {
    let e = null;
    for (const n of this._def.checks)
      n.kind === "min" && (e === null || n.value > e) && (e = n.value);
    return e;
  }
  get maxValue() {
    let e = null;
    for (const n of this._def.checks)
      n.kind === "max" && (e === null || n.value < e) && (e = n.value);
    return e;
  }
}
ut.create = (t) => new ut({
  checks: [],
  typeName: T.ZodBigInt,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...O(t)
});
class cn extends j {
  _parse(e) {
    if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== k.boolean) {
      const o = this._getOrReturnCtx(e);
      return $(o, {
        code: v.invalid_type,
        expected: k.boolean,
        received: o.parsedType
      }), A;
    }
    return re(e.data);
  }
}
cn.create = (t) => new cn({
  typeName: T.ZodBoolean,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...O(t)
});
class Rt extends j {
  _parse(e) {
    if (this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== k.date) {
      const s = this._getOrReturnCtx(e);
      return $(s, {
        code: v.invalid_type,
        expected: k.date,
        received: s.parsedType
      }), A;
    }
    if (Number.isNaN(e.data.getTime())) {
      const s = this._getOrReturnCtx(e);
      return $(s, {
        code: v.invalid_date
      }), A;
    }
    const o = new Y();
    let r;
    for (const s of this._def.checks)
      s.kind === "min" ? e.data.getTime() < s.value && (r = this._getOrReturnCtx(e, r), $(r, {
        code: v.too_small,
        message: s.message,
        inclusive: !0,
        exact: !1,
        minimum: s.value,
        type: "date"
      }), o.dirty()) : s.kind === "max" ? e.data.getTime() > s.value && (r = this._getOrReturnCtx(e, r), $(r, {
        code: v.too_big,
        message: s.message,
        inclusive: !0,
        exact: !1,
        maximum: s.value,
        type: "date"
      }), o.dirty()) : P.assertNever(s);
    return {
      status: o.value,
      value: new Date(e.data.getTime())
    };
  }
  _addCheck(e) {
    return new Rt({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  min(e, n) {
    return this._addCheck({
      kind: "min",
      value: e.getTime(),
      message: x.toString(n)
    });
  }
  max(e, n) {
    return this._addCheck({
      kind: "max",
      value: e.getTime(),
      message: x.toString(n)
    });
  }
  get minDate() {
    let e = null;
    for (const n of this._def.checks)
      n.kind === "min" && (e === null || n.value > e) && (e = n.value);
    return e != null ? new Date(e) : null;
  }
  get maxDate() {
    let e = null;
    for (const n of this._def.checks)
      n.kind === "max" && (e === null || n.value < e) && (e = n.value);
    return e != null ? new Date(e) : null;
  }
}
Rt.create = (t) => new Rt({
  checks: [],
  coerce: (t == null ? void 0 : t.coerce) || !1,
  typeName: T.ZodDate,
  ...O(t)
});
class io extends j {
  _parse(e) {
    if (this._getType(e) !== k.symbol) {
      const o = this._getOrReturnCtx(e);
      return $(o, {
        code: v.invalid_type,
        expected: k.symbol,
        received: o.parsedType
      }), A;
    }
    return re(e.data);
  }
}
io.create = (t) => new io({
  typeName: T.ZodSymbol,
  ...O(t)
});
class ao extends j {
  _parse(e) {
    if (this._getType(e) !== k.undefined) {
      const o = this._getOrReturnCtx(e);
      return $(o, {
        code: v.invalid_type,
        expected: k.undefined,
        received: o.parsedType
      }), A;
    }
    return re(e.data);
  }
}
ao.create = (t) => new ao({
  typeName: T.ZodUndefined,
  ...O(t)
});
class lo extends j {
  _parse(e) {
    if (this._getType(e) !== k.null) {
      const o = this._getOrReturnCtx(e);
      return $(o, {
        code: v.invalid_type,
        expected: k.null,
        received: o.parsedType
      }), A;
    }
    return re(e.data);
  }
}
lo.create = (t) => new lo({
  typeName: T.ZodNull,
  ...O(t)
});
class co extends j {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e) {
    return re(e.data);
  }
}
co.create = (t) => new co({
  typeName: T.ZodAny,
  ...O(t)
});
class dn extends j {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(e) {
    return re(e.data);
  }
}
dn.create = (t) => new dn({
  typeName: T.ZodUnknown,
  ...O(t)
});
class Ae extends j {
  _parse(e) {
    const n = this._getOrReturnCtx(e);
    return $(n, {
      code: v.invalid_type,
      expected: k.never,
      received: n.parsedType
    }), A;
  }
}
Ae.create = (t) => new Ae({
  typeName: T.ZodNever,
  ...O(t)
});
class uo extends j {
  _parse(e) {
    if (this._getType(e) !== k.undefined) {
      const o = this._getOrReturnCtx(e);
      return $(o, {
        code: v.invalid_type,
        expected: k.void,
        received: o.parsedType
      }), A;
    }
    return re(e.data);
  }
}
uo.create = (t) => new uo({
  typeName: T.ZodVoid,
  ...O(t)
});
class se extends j {
  _parse(e) {
    const { ctx: n, status: o } = this._processInputParams(e), r = this._def;
    if (n.parsedType !== k.array)
      return $(n, {
        code: v.invalid_type,
        expected: k.array,
        received: n.parsedType
      }), A;
    if (r.exactLength !== null) {
      const i = n.data.length > r.exactLength.value, a = n.data.length < r.exactLength.value;
      (i || a) && ($(n, {
        code: i ? v.too_big : v.too_small,
        minimum: a ? r.exactLength.value : void 0,
        maximum: i ? r.exactLength.value : void 0,
        type: "array",
        inclusive: !0,
        exact: !0,
        message: r.exactLength.message
      }), o.dirty());
    }
    if (r.minLength !== null && n.data.length < r.minLength.value && ($(n, {
      code: v.too_small,
      minimum: r.minLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: r.minLength.message
    }), o.dirty()), r.maxLength !== null && n.data.length > r.maxLength.value && ($(n, {
      code: v.too_big,
      maximum: r.maxLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: r.maxLength.message
    }), o.dirty()), n.common.async)
      return Promise.all([...n.data].map((i, a) => r.type._parseAsync(new pe(n, i, n.path, a)))).then((i) => Y.mergeArray(o, i));
    const s = [...n.data].map((i, a) => r.type._parseSync(new pe(n, i, n.path, a)));
    return Y.mergeArray(o, s);
  }
  get element() {
    return this._def.type;
  }
  min(e, n) {
    return new se({
      ...this._def,
      minLength: { value: e, message: x.toString(n) }
    });
  }
  max(e, n) {
    return new se({
      ...this._def,
      maxLength: { value: e, message: x.toString(n) }
    });
  }
  length(e, n) {
    return new se({
      ...this._def,
      exactLength: { value: e, message: x.toString(n) }
    });
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
se.create = (t, e) => new se({
  type: t,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: T.ZodArray,
  ...O(e)
});
function Je(t) {
  if (t instanceof F) {
    const e = {};
    for (const n in t.shape) {
      const o = t.shape[n];
      e[n] = Te.create(Je(o));
    }
    return new F({
      ...t._def,
      shape: () => e
    });
  } else return t instanceof se ? new se({
    ...t._def,
    type: Je(t.element)
  }) : t instanceof Te ? Te.create(Je(t.unwrap())) : t instanceof ot ? ot.create(Je(t.unwrap())) : t instanceof Fe ? Fe.create(t.items.map((e) => Je(e))) : t;
}
class F extends j {
  constructor() {
    super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const e = this._def.shape(), n = P.objectKeys(e);
    return this._cached = { shape: e, keys: n }, this._cached;
  }
  _parse(e) {
    if (this._getType(e) !== k.object) {
      const c = this._getOrReturnCtx(e);
      return $(c, {
        code: v.invalid_type,
        expected: k.object,
        received: c.parsedType
      }), A;
    }
    const { status: o, ctx: r } = this._processInputParams(e), { shape: s, keys: i } = this._getCached(), a = [];
    if (!(this._def.catchall instanceof Ae && this._def.unknownKeys === "strip"))
      for (const c in r.data)
        i.includes(c) || a.push(c);
    const l = [];
    for (const c of i) {
      const d = s[c], u = r.data[c];
      l.push({
        key: { status: "valid", value: c },
        value: d._parse(new pe(r, u, r.path, c)),
        alwaysSet: c in r.data
      });
    }
    if (this._def.catchall instanceof Ae) {
      const c = this._def.unknownKeys;
      if (c === "passthrough")
        for (const d of a)
          l.push({
            key: { status: "valid", value: d },
            value: { status: "valid", value: r.data[d] }
          });
      else if (c === "strict")
        a.length > 0 && ($(r, {
          code: v.unrecognized_keys,
          keys: a
        }), o.dirty());
      else if (c !== "strip") throw new Error("Internal ZodObject error: invalid unknownKeys value.");
    } else {
      const c = this._def.catchall;
      for (const d of a) {
        const u = r.data[d];
        l.push({
          key: { status: "valid", value: d },
          value: c._parse(
            new pe(r, u, r.path, d)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: d in r.data
        });
      }
    }
    return r.common.async ? Promise.resolve().then(async () => {
      const c = [];
      for (const d of l) {
        const u = await d.key, y = await d.value;
        c.push({
          key: u,
          value: y,
          alwaysSet: d.alwaysSet
        });
      }
      return c;
    }).then((c) => Y.mergeObjectSync(o, c)) : Y.mergeObjectSync(o, l);
  }
  get shape() {
    return this._def.shape();
  }
  strict(e) {
    return x.errToObj, new F({
      ...this._def,
      unknownKeys: "strict",
      ...e !== void 0 ? {
        errorMap: (n, o) => {
          var s, i;
          const r = ((i = (s = this._def).errorMap) == null ? void 0 : i.call(s, n, o).message) ?? o.defaultError;
          return n.code === "unrecognized_keys" ? {
            message: x.errToObj(e).message ?? r
          } : {
            message: r
          };
        }
      } : {}
    });
  }
  strip() {
    return new F({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new F({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(e) {
    return new F({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...e
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(e) {
    return new F({
      unknownKeys: e._def.unknownKeys,
      catchall: e._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...e._def.shape()
      }),
      typeName: T.ZodObject
    });
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(e, n) {
    return this.augment({ [e]: n });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(e) {
    return new F({
      ...this._def,
      catchall: e
    });
  }
  pick(e) {
    const n = {};
    for (const o of P.objectKeys(e))
      e[o] && this.shape[o] && (n[o] = this.shape[o]);
    return new F({
      ...this._def,
      shape: () => n
    });
  }
  omit(e) {
    const n = {};
    for (const o of P.objectKeys(this.shape))
      e[o] || (n[o] = this.shape[o]);
    return new F({
      ...this._def,
      shape: () => n
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return Je(this);
  }
  partial(e) {
    const n = {};
    for (const o of P.objectKeys(this.shape)) {
      const r = this.shape[o];
      e && !e[o] ? n[o] = r : n[o] = r.optional();
    }
    return new F({
      ...this._def,
      shape: () => n
    });
  }
  required(e) {
    const n = {};
    for (const o of P.objectKeys(this.shape))
      if (e && !e[o])
        n[o] = this.shape[o];
      else {
        let s = this.shape[o];
        for (; s instanceof Te; )
          s = s._def.innerType;
        n[o] = s;
      }
    return new F({
      ...this._def,
      shape: () => n
    });
  }
  keyof() {
    return Or(P.objectKeys(this.shape));
  }
}
F.create = (t, e) => new F({
  shape: () => t,
  unknownKeys: "strip",
  catchall: Ae.create(),
  typeName: T.ZodObject,
  ...O(e)
});
F.strictCreate = (t, e) => new F({
  shape: () => t,
  unknownKeys: "strict",
  catchall: Ae.create(),
  typeName: T.ZodObject,
  ...O(e)
});
F.lazycreate = (t, e) => new F({
  shape: t,
  unknownKeys: "strip",
  catchall: Ae.create(),
  typeName: T.ZodObject,
  ...O(e)
});
class Pt extends j {
  _parse(e) {
    const { ctx: n } = this._processInputParams(e), o = this._def.options;
    function r(s) {
      for (const a of s)
        if (a.result.status === "valid")
          return a.result;
      for (const a of s)
        if (a.result.status === "dirty")
          return n.common.issues.push(...a.ctx.common.issues), a.result;
      const i = s.map((a) => new be(a.ctx.common.issues));
      return $(n, {
        code: v.invalid_union,
        unionErrors: i
      }), A;
    }
    if (n.common.async)
      return Promise.all(o.map(async (s) => {
        const i = {
          ...n,
          common: {
            ...n.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await s._parseAsync({
            data: n.data,
            path: n.path,
            parent: i
          }),
          ctx: i
        };
      })).then(r);
    {
      let s;
      const i = [];
      for (const l of o) {
        const c = {
          ...n,
          common: {
            ...n.common,
            issues: []
          },
          parent: null
        }, d = l._parseSync({
          data: n.data,
          path: n.path,
          parent: c
        });
        if (d.status === "valid")
          return d;
        d.status === "dirty" && !s && (s = { result: d, ctx: c }), c.common.issues.length && i.push(c.common.issues);
      }
      if (s)
        return n.common.issues.push(...s.ctx.common.issues), s.result;
      const a = i.map((l) => new be(l));
      return $(n, {
        code: v.invalid_union,
        unionErrors: a
      }), A;
    }
  }
  get options() {
    return this._def.options;
  }
}
Pt.create = (t, e) => new Pt({
  options: t,
  typeName: T.ZodUnion,
  ...O(e)
});
function un(t, e) {
  const n = xe(t), o = xe(e);
  if (t === e)
    return { valid: !0, data: t };
  if (n === k.object && o === k.object) {
    const r = P.objectKeys(e), s = P.objectKeys(t).filter((a) => r.indexOf(a) !== -1), i = { ...t, ...e };
    for (const a of s) {
      const l = un(t[a], e[a]);
      if (!l.valid)
        return { valid: !1 };
      i[a] = l.data;
    }
    return { valid: !0, data: i };
  } else if (n === k.array && o === k.array) {
    if (t.length !== e.length)
      return { valid: !1 };
    const r = [];
    for (let s = 0; s < t.length; s++) {
      const i = t[s], a = e[s], l = un(i, a);
      if (!l.valid)
        return { valid: !1 };
      r.push(l.data);
    }
    return { valid: !0, data: r };
  } else return n === k.date && o === k.date && +t == +e ? { valid: !0, data: t } : { valid: !1 };
}
class Lt extends j {
  _parse(e) {
    const { status: n, ctx: o } = this._processInputParams(e), r = (s, i) => {
      if (oo(s) || oo(i))
        return A;
      const a = un(s.value, i.value);
      return a.valid ? ((ro(s) || ro(i)) && n.dirty(), { status: n.value, value: a.data }) : ($(o, {
        code: v.invalid_intersection_types
      }), A);
    };
    return o.common.async ? Promise.all([
      this._def.left._parseAsync({
        data: o.data,
        path: o.path,
        parent: o
      }),
      this._def.right._parseAsync({
        data: o.data,
        path: o.path,
        parent: o
      })
    ]).then(([s, i]) => r(s, i)) : r(this._def.left._parseSync({
      data: o.data,
      path: o.path,
      parent: o
    }), this._def.right._parseSync({
      data: o.data,
      path: o.path,
      parent: o
    }));
  }
}
Lt.create = (t, e, n) => new Lt({
  left: t,
  right: e,
  typeName: T.ZodIntersection,
  ...O(n)
});
class Fe extends j {
  _parse(e) {
    const { status: n, ctx: o } = this._processInputParams(e);
    if (o.parsedType !== k.array)
      return $(o, {
        code: v.invalid_type,
        expected: k.array,
        received: o.parsedType
      }), A;
    if (o.data.length < this._def.items.length)
      return $(o, {
        code: v.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), A;
    !this._def.rest && o.data.length > this._def.items.length && ($(o, {
      code: v.too_big,
      maximum: this._def.items.length,
      inclusive: !0,
      exact: !1,
      type: "array"
    }), n.dirty());
    const s = [...o.data].map((i, a) => {
      const l = this._def.items[a] || this._def.rest;
      return l ? l._parse(new pe(o, i, o.path, a)) : null;
    }).filter((i) => !!i);
    return o.common.async ? Promise.all(s).then((i) => Y.mergeArray(n, i)) : Y.mergeArray(n, s);
  }
  get items() {
    return this._def.items;
  }
  rest(e) {
    return new Fe({
      ...this._def,
      rest: e
    });
  }
}
Fe.create = (t, e) => {
  if (!Array.isArray(t))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new Fe({
    items: t,
    typeName: T.ZodTuple,
    rest: null,
    ...O(e)
  });
};
class Mt extends j {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e) {
    const { status: n, ctx: o } = this._processInputParams(e);
    if (o.parsedType !== k.object)
      return $(o, {
        code: v.invalid_type,
        expected: k.object,
        received: o.parsedType
      }), A;
    const r = [], s = this._def.keyType, i = this._def.valueType;
    for (const a in o.data)
      r.push({
        key: s._parse(new pe(o, a, o.path, a)),
        value: i._parse(new pe(o, o.data[a], o.path, a)),
        alwaysSet: a in o.data
      });
    return o.common.async ? Y.mergeObjectAsync(n, r) : Y.mergeObjectSync(n, r);
  }
  get element() {
    return this._def.valueType;
  }
  static create(e, n, o) {
    return n instanceof j ? new Mt({
      keyType: e,
      valueType: n,
      typeName: T.ZodRecord,
      ...O(o)
    }) : new Mt({
      keyType: ge.create(),
      valueType: e,
      typeName: T.ZodRecord,
      ...O(n)
    });
  }
}
class ho extends j {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e) {
    const { status: n, ctx: o } = this._processInputParams(e);
    if (o.parsedType !== k.map)
      return $(o, {
        code: v.invalid_type,
        expected: k.map,
        received: o.parsedType
      }), A;
    const r = this._def.keyType, s = this._def.valueType, i = [...o.data.entries()].map(([a, l], c) => ({
      key: r._parse(new pe(o, a, o.path, [c, "key"])),
      value: s._parse(new pe(o, l, o.path, [c, "value"]))
    }));
    if (o.common.async) {
      const a = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const l of i) {
          const c = await l.key, d = await l.value;
          if (c.status === "aborted" || d.status === "aborted")
            return A;
          (c.status === "dirty" || d.status === "dirty") && n.dirty(), a.set(c.value, d.value);
        }
        return { status: n.value, value: a };
      });
    } else {
      const a = /* @__PURE__ */ new Map();
      for (const l of i) {
        const c = l.key, d = l.value;
        if (c.status === "aborted" || d.status === "aborted")
          return A;
        (c.status === "dirty" || d.status === "dirty") && n.dirty(), a.set(c.value, d.value);
      }
      return { status: n.value, value: a };
    }
  }
}
ho.create = (t, e, n) => new ho({
  valueType: e,
  keyType: t,
  typeName: T.ZodMap,
  ...O(n)
});
class ht extends j {
  _parse(e) {
    const { status: n, ctx: o } = this._processInputParams(e);
    if (o.parsedType !== k.set)
      return $(o, {
        code: v.invalid_type,
        expected: k.set,
        received: o.parsedType
      }), A;
    const r = this._def;
    r.minSize !== null && o.data.size < r.minSize.value && ($(o, {
      code: v.too_small,
      minimum: r.minSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: r.minSize.message
    }), n.dirty()), r.maxSize !== null && o.data.size > r.maxSize.value && ($(o, {
      code: v.too_big,
      maximum: r.maxSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: r.maxSize.message
    }), n.dirty());
    const s = this._def.valueType;
    function i(l) {
      const c = /* @__PURE__ */ new Set();
      for (const d of l) {
        if (d.status === "aborted")
          return A;
        d.status === "dirty" && n.dirty(), c.add(d.value);
      }
      return { status: n.value, value: c };
    }
    const a = [...o.data.values()].map((l, c) => s._parse(new pe(o, l, o.path, c)));
    return o.common.async ? Promise.all(a).then((l) => i(l)) : i(a);
  }
  min(e, n) {
    return new ht({
      ...this._def,
      minSize: { value: e, message: x.toString(n) }
    });
  }
  max(e, n) {
    return new ht({
      ...this._def,
      maxSize: { value: e, message: x.toString(n) }
    });
  }
  size(e, n) {
    return this.min(e, n).max(e, n);
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
ht.create = (t, e) => new ht({
  valueType: t,
  minSize: null,
  maxSize: null,
  typeName: T.ZodSet,
  ...O(e)
});
class hn extends j {
  get schema() {
    return this._def.getter();
  }
  _parse(e) {
    const { ctx: n } = this._processInputParams(e);
    return this._def.getter()._parse({ data: n.data, path: n.path, parent: n });
  }
}
hn.create = (t, e) => new hn({
  getter: t,
  typeName: T.ZodLazy,
  ...O(e)
});
class pn extends j {
  _parse(e) {
    if (e.data !== this._def.value) {
      const n = this._getOrReturnCtx(e);
      return $(n, {
        received: n.data,
        code: v.invalid_literal,
        expected: this._def.value
      }), A;
    }
    return { status: "valid", value: e.data };
  }
  get value() {
    return this._def.value;
  }
}
pn.create = (t, e) => new pn({
  value: t,
  typeName: T.ZodLiteral,
  ...O(e)
});
function Or(t, e) {
  return new tt({
    values: t,
    typeName: T.ZodEnum,
    ...O(e)
  });
}
class tt extends j {
  _parse(e) {
    if (typeof e.data != "string") {
      const n = this._getOrReturnCtx(e), o = this._def.values;
      return $(n, {
        expected: P.joinValues(o),
        received: n.parsedType,
        code: v.invalid_type
      }), A;
    }
    if (this._cache || (this._cache = new Set(this._def.values)), !this._cache.has(e.data)) {
      const n = this._getOrReturnCtx(e), o = this._def.values;
      return $(n, {
        received: n.data,
        code: v.invalid_enum_value,
        options: o
      }), A;
    }
    return re(e.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const e = {};
    for (const n of this._def.values)
      e[n] = n;
    return e;
  }
  get Values() {
    const e = {};
    for (const n of this._def.values)
      e[n] = n;
    return e;
  }
  get Enum() {
    const e = {};
    for (const n of this._def.values)
      e[n] = n;
    return e;
  }
  extract(e, n = this._def) {
    return tt.create(e, {
      ...this._def,
      ...n
    });
  }
  exclude(e, n = this._def) {
    return tt.create(this.options.filter((o) => !e.includes(o)), {
      ...this._def,
      ...n
    });
  }
}
tt.create = Or;
class po extends j {
  _parse(e) {
    const n = P.getValidEnumValues(this._def.values), o = this._getOrReturnCtx(e);
    if (o.parsedType !== k.string && o.parsedType !== k.number) {
      const r = P.objectValues(n);
      return $(o, {
        expected: P.joinValues(r),
        received: o.parsedType,
        code: v.invalid_type
      }), A;
    }
    if (this._cache || (this._cache = new Set(P.getValidEnumValues(this._def.values))), !this._cache.has(e.data)) {
      const r = P.objectValues(n);
      return $(o, {
        received: o.data,
        code: v.invalid_enum_value,
        options: r
      }), A;
    }
    return re(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
po.create = (t, e) => new po({
  values: t,
  typeName: T.ZodNativeEnum,
  ...O(e)
});
class Bt extends j {
  unwrap() {
    return this._def.type;
  }
  _parse(e) {
    const { ctx: n } = this._processInputParams(e);
    if (n.parsedType !== k.promise && n.common.async === !1)
      return $(n, {
        code: v.invalid_type,
        expected: k.promise,
        received: n.parsedType
      }), A;
    const o = n.parsedType === k.promise ? n.data : Promise.resolve(n.data);
    return re(o.then((r) => this._def.type.parseAsync(r, {
      path: n.path,
      errorMap: n.common.contextualErrorMap
    })));
  }
}
Bt.create = (t, e) => new Bt({
  type: t,
  typeName: T.ZodPromise,
  ...O(e)
});
class nt extends j {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === T.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(e) {
    const { status: n, ctx: o } = this._processInputParams(e), r = this._def.effect || null, s = {
      addIssue: (i) => {
        $(o, i), i.fatal ? n.abort() : n.dirty();
      },
      get path() {
        return o.path;
      }
    };
    if (s.addIssue = s.addIssue.bind(s), r.type === "preprocess") {
      const i = r.transform(o.data, s);
      if (o.common.async)
        return Promise.resolve(i).then(async (a) => {
          if (n.value === "aborted")
            return A;
          const l = await this._def.schema._parseAsync({
            data: a,
            path: o.path,
            parent: o
          });
          return l.status === "aborted" ? A : l.status === "dirty" || n.value === "dirty" ? lt(l.value) : l;
        });
      {
        if (n.value === "aborted")
          return A;
        const a = this._def.schema._parseSync({
          data: i,
          path: o.path,
          parent: o
        });
        return a.status === "aborted" ? A : a.status === "dirty" || n.value === "dirty" ? lt(a.value) : a;
      }
    }
    if (r.type === "refinement") {
      const i = (a) => {
        const l = r.refinement(a, s);
        if (o.common.async)
          return Promise.resolve(l);
        if (l instanceof Promise)
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        return a;
      };
      if (o.common.async === !1) {
        const a = this._def.schema._parseSync({
          data: o.data,
          path: o.path,
          parent: o
        });
        return a.status === "aborted" ? A : (a.status === "dirty" && n.dirty(), i(a.value), { status: n.value, value: a.value });
      } else
        return this._def.schema._parseAsync({ data: o.data, path: o.path, parent: o }).then((a) => a.status === "aborted" ? A : (a.status === "dirty" && n.dirty(), i(a.value).then(() => ({ status: n.value, value: a.value }))));
    }
    if (r.type === "transform")
      if (o.common.async === !1) {
        const i = this._def.schema._parseSync({
          data: o.data,
          path: o.path,
          parent: o
        });
        if (!Qe(i))
          return A;
        const a = r.transform(i.value, s);
        if (a instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: n.value, value: a };
      } else
        return this._def.schema._parseAsync({ data: o.data, path: o.path, parent: o }).then((i) => Qe(i) ? Promise.resolve(r.transform(i.value, s)).then((a) => ({
          status: n.value,
          value: a
        })) : A);
    P.assertNever(r);
  }
}
nt.create = (t, e, n) => new nt({
  schema: t,
  typeName: T.ZodEffects,
  effect: e,
  ...O(n)
});
nt.createWithPreprocess = (t, e, n) => new nt({
  schema: e,
  effect: { type: "preprocess", transform: t },
  typeName: T.ZodEffects,
  ...O(n)
});
class Te extends j {
  _parse(e) {
    return this._getType(e) === k.undefined ? re(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
Te.create = (t, e) => new Te({
  innerType: t,
  typeName: T.ZodOptional,
  ...O(e)
});
class ot extends j {
  _parse(e) {
    return this._getType(e) === k.null ? re(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ot.create = (t, e) => new ot({
  innerType: t,
  typeName: T.ZodNullable,
  ...O(e)
});
class Dt extends j {
  _parse(e) {
    const { ctx: n } = this._processInputParams(e);
    let o = n.data;
    return n.parsedType === k.undefined && (o = this._def.defaultValue()), this._def.innerType._parse({
      data: o,
      path: n.path,
      parent: n
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
Dt.create = (t, e) => new Dt({
  innerType: t,
  typeName: T.ZodDefault,
  defaultValue: typeof e.default == "function" ? e.default : () => e.default,
  ...O(e)
});
class fn extends j {
  _parse(e) {
    const { ctx: n } = this._processInputParams(e), o = {
      ...n,
      common: {
        ...n.common,
        issues: []
      }
    }, r = this._def.innerType._parse({
      data: o.data,
      path: o.path,
      parent: {
        ...o
      }
    });
    return jt(r) ? r.then((s) => ({
      status: "valid",
      value: s.status === "valid" ? s.value : this._def.catchValue({
        get error() {
          return new be(o.common.issues);
        },
        input: o.data
      })
    })) : {
      status: "valid",
      value: r.status === "valid" ? r.value : this._def.catchValue({
        get error() {
          return new be(o.common.issues);
        },
        input: o.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
}
fn.create = (t, e) => new fn({
  innerType: t,
  typeName: T.ZodCatch,
  catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
  ...O(e)
});
class fo extends j {
  _parse(e) {
    if (this._getType(e) !== k.nan) {
      const o = this._getOrReturnCtx(e);
      return $(o, {
        code: v.invalid_type,
        expected: k.nan,
        received: o.parsedType
      }), A;
    }
    return { status: "valid", value: e.data };
  }
}
fo.create = (t) => new fo({
  typeName: T.ZodNaN,
  ...O(t)
});
class ta extends j {
  _parse(e) {
    const { ctx: n } = this._processInputParams(e), o = n.data;
    return this._def.type._parse({
      data: o,
      path: n.path,
      parent: n
    });
  }
  unwrap() {
    return this._def.type;
  }
}
class Cn extends j {
  _parse(e) {
    const { status: n, ctx: o } = this._processInputParams(e);
    if (o.common.async)
      return (async () => {
        const s = await this._def.in._parseAsync({
          data: o.data,
          path: o.path,
          parent: o
        });
        return s.status === "aborted" ? A : s.status === "dirty" ? (n.dirty(), lt(s.value)) : this._def.out._parseAsync({
          data: s.value,
          path: o.path,
          parent: o
        });
      })();
    {
      const r = this._def.in._parseSync({
        data: o.data,
        path: o.path,
        parent: o
      });
      return r.status === "aborted" ? A : r.status === "dirty" ? (n.dirty(), {
        status: "dirty",
        value: r.value
      }) : this._def.out._parseSync({
        data: r.value,
        path: o.path,
        parent: o
      });
    }
  }
  static create(e, n) {
    return new Cn({
      in: e,
      out: n,
      typeName: T.ZodPipeline
    });
  }
}
class mn extends j {
  _parse(e) {
    const n = this._def.innerType._parse(e), o = (r) => (Qe(r) && (r.value = Object.freeze(r.value)), r);
    return jt(n) ? n.then((r) => o(r)) : o(n);
  }
  unwrap() {
    return this._def.innerType;
  }
}
mn.create = (t, e) => new mn({
  innerType: t,
  typeName: T.ZodReadonly,
  ...O(e)
});
var T;
(function(t) {
  t.ZodString = "ZodString", t.ZodNumber = "ZodNumber", t.ZodNaN = "ZodNaN", t.ZodBigInt = "ZodBigInt", t.ZodBoolean = "ZodBoolean", t.ZodDate = "ZodDate", t.ZodSymbol = "ZodSymbol", t.ZodUndefined = "ZodUndefined", t.ZodNull = "ZodNull", t.ZodAny = "ZodAny", t.ZodUnknown = "ZodUnknown", t.ZodNever = "ZodNever", t.ZodVoid = "ZodVoid", t.ZodArray = "ZodArray", t.ZodObject = "ZodObject", t.ZodUnion = "ZodUnion", t.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", t.ZodIntersection = "ZodIntersection", t.ZodTuple = "ZodTuple", t.ZodRecord = "ZodRecord", t.ZodMap = "ZodMap", t.ZodSet = "ZodSet", t.ZodFunction = "ZodFunction", t.ZodLazy = "ZodLazy", t.ZodLiteral = "ZodLiteral", t.ZodEnum = "ZodEnum", t.ZodEffects = "ZodEffects", t.ZodNativeEnum = "ZodNativeEnum", t.ZodOptional = "ZodOptional", t.ZodNullable = "ZodNullable", t.ZodDefault = "ZodDefault", t.ZodCatch = "ZodCatch", t.ZodPromise = "ZodPromise", t.ZodBranded = "ZodBranded", t.ZodPipeline = "ZodPipeline", t.ZodReadonly = "ZodReadonly";
})(T || (T = {}));
const w = ge.create, ve = et.create, M = cn.create, Cr = dn.create;
Ae.create;
const q = se.create, I = F.create, na = Pt.create;
Lt.create;
Fe.create;
const Q = Mt.create, oa = hn.create, Et = pn.create, C = tt.create;
Bt.create;
Te.create;
ot.create;
const ra = [
  { id: "claude-opus-5", label: "Opus 5", hint: "Most capable" },
  { id: "claude-sonnet-5", label: "Sonnet 5", hint: "Balanced" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5", hint: "Fastest / cheapest" }
], sa = ra.map((t) => t.id), ia = "claude-opus-5", aa = ["low", "medium", "high", "xhigh", "max"], la = "medium", ca = {
  "claude-opus-5": { inputPerMTok: 5, outputPerMTok: 25 },
  "claude-sonnet-5": { inputPerMTok: 2, outputPerMTok: 10 },
  "claude-haiku-4-5": { inputPerMTok: 1, outputPerMTok: 5 }
}, da = 1.25, ua = 0.1;
function ha(t, e, n, o = {}) {
  const r = t ? ca[t] : void 0;
  return !r || e == null || n == null ? void 0 : (e + (o.writeTokens ?? 0) * da + (o.readTokens ?? 0) * ua) / 1e6 * r.inputPerMTok + n / 1e6 * r.outputPerMTok;
}
const Ge = {
  core: "Raw values (a hex color, a pixel size). They exist only so other tokens can point at them. Never assign one — not even when its value is exactly what you want.",
  semantic: "Intent (primary text, elevated surface, default border, live status, focus glow), each an alias to a core value. Every color you assign is a semantic token chosen by the element’s role, never by its look: white text is the primary-text token.",
  layout: "The grid spacing steps and the radius steps. Assign them only to layout props — padding, gap, corner radius."
}, yn = ["video", "overlay", "content"], Ve = [
  "scrim",
  "bottom",
  "bottom-right",
  "bottom-left",
  "right",
  "left",
  "top-right"
], pa = [0, 1, 2, 3], fa = ["law", "pattern", "convention"], pt = 200, gn = 60, ma = 100, X = 4e3, ya = 200, ee = w().min(1).max(120), K = w().max(200), ga = I({
  name: w().min(1).max(120),
  raw: w().max(X).optional()
}).strict(), Nr = I({
  name: w().min(1).max(120),
  type: ga,
  required: M(),
  defaultValue: Cr().optional(),
  options: q(w().max(200)).max(ma).optional(),
  description: w().max(X).optional(),
  tokenGroup: C(["colors", "spacing", "typography", "radius", "shadow", "gradients", "motion"]).optional(),
  control: C(["text", "textarea", "select", "boolean", "number", "list"]).optional(),
  nullable: M().optional(),
  min: ve().finite().optional(),
  max: ve().finite().optional(),
  step: ve().finite().positive().optional(),
  grid: M().optional(),
  fields: Q(oa(() => Nr)).refine((t) => Object.keys(t).length <= gn).optional()
}).strict(), va = I({
  id: ee,
  name: K,
  description: w().max(X),
  category: K.optional(),
  acceptsChildren: M(),
  slots: q(ee).max(pt).optional(),
  parents: q(ee).max(pt).optional(),
  props: Q(Nr).refine((t) => Object.keys(t).length <= gn, {
    message: `a component may declare at most ${gn} props`
  }),
  storybookPath: w().max(X).optional()
}).strict(), Re = Q(w().max(X)), ba = I({
  colors: Re,
  spacing: Re,
  typography: Re,
  radius: Re.optional(),
  shadow: Re.optional(),
  gradients: Re.optional(),
  motion: Re.optional()
}).strict(), Pe = C(["core", "semantic", "layout"]), wa = I({
  rule: I({
    core: w().max(X),
    semantic: w().max(X),
    layout: w().max(X)
  }).strict(),
  tiers: I({
    colors: Q(Pe).optional(),
    spacing: Q(Pe).optional(),
    typography: Q(Pe).optional(),
    radius: Q(Pe).optional(),
    shadow: Q(Pe).optional(),
    gradients: Q(Pe).optional(),
    motion: Q(Pe).optional()
  }).strict()
}).strict(), at = 40, $a = 40, ka = I({
  id: ee,
  name: K,
  when: w().min(1).max(400),
  blueprint: Q(Cr())
}).strict(), mo = na([Et(0), Et(1), Et(2), Et(3)]), xa = C(Ve), _a = I({
  rule: w().max(X),
  stack: q(C(yn)).max(yn.length),
  shades: I(Object.fromEntries(Ve.map((t) => [t, w().min(1).max(200)]))).strict(),
  levels: q(
    I({
      level: mo,
      name: K,
      rule: w().max(X),
      maxModules: ve().int().min(0).nullable(),
      allowsAnchor: M(),
      rootEnd: M().optional(),
      rootColumn: M().optional(),
      initialFocus: I({
        on: q(ee).min(1).max(8),
        value: K.optional(),
        hint: w().max(X),
        required: M().optional(),
        anchored: M().optional()
      }).strict().optional()
    }).strict()
  ).max(pa.length),
  models: q(
    I({
      id: ee,
      name: K,
      level: mo,
      side: C(["left", "right"]).optional(),
      shades: q(xa).min(1).max(Ve.length),
      allowsRootStart: M().optional(),
      use: w().max(X)
    }).strict()
  ).max(at),
  menu: I({
    component: ee,
    prop: K,
    initial: K,
    roles: q(
      I({ item: K, name: K, side: C(["left", "right"]), holds: w().max(X) }).strict()
    ).max(at)
  }).strict().optional(),
  links: I({
    none: q(ee).max(at).optional(),
    back: q(ee).max(at).optional(),
    close: q(ee).max(at).optional()
  }).strict().optional()
}).strict().superRefine((t, e) => {
  const n = /* @__PURE__ */ new Set(), o = new Set(t.levels.map((r) => r.level));
  for (const r of t.models)
    n.has(r.id) && e.addIssue({ code: "custom", message: `duplicate layer model "${r.id}"` }), n.add(r.id), o.has(r.level) || e.addIssue({ code: "custom", message: `layer model "${r.id}" is on level ${r.level}, which the rule doesn't define` });
}), Sa = q(
  I({
    id: ee,
    title: K,
    statement: w().min(1).max(X),
    flexibility: C(fa),
    category: K,
    source: K,
    appliesTo: q(ee).max(pt).optional()
  }).strict()
).max(ya).superRefine((t, e) => {
  const n = /* @__PURE__ */ new Set();
  for (const o of t)
    n.has(o.id) && e.addIssue({ code: "custom", message: `duplicate rule "${o.id}"` }), n.add(o.id);
}), Nn = I({
  id: ee,
  name: K,
  version: w().min(1).max(60),
  tokens: ba,
  tokenTiers: wa.optional(),
  screenLayers: _a.optional(),
  templates: q(ka).max($a).optional(),
  rules: Sa.optional(),
  components: Q(va).refine((t) => Object.keys(t).length >= 1, { message: "a manifest needs at least one component" }).refine((t) => Object.keys(t).length <= pt, {
    message: `a manifest may declare at most ${pt} components`
  })
}).strict();
function Ta(t) {
  if (t.control) return t.control;
  if (t.options && t.options.length > 0) return "select";
  switch (t.type.name) {
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "array":
      return "list";
    default:
      return "text";
  }
}
function Ze(t) {
  if (t.defaultValue !== void 0) return t.defaultValue;
  if (t.required) {
    if (t.options && t.options.length > 0) return t.options[0];
    switch (t.type.name) {
      case "boolean":
        return !1;
      case "number":
        return 0;
      case "array":
        return [];
      default:
        return "";
    }
  }
}
function Aa(t) {
  const e = {};
  for (const n of Object.values(t.props)) {
    const o = Ze(n);
    o !== void 0 && (e[n.name] = o);
  }
  return e;
}
function jn(t, e) {
  return Object.keys(t.tokens[e] ?? {});
}
function jr(t, e, n) {
  const o = t.components[e], r = t.components[n];
  return !o || !r ? null : Ia(o, r);
}
function Ia(t, e) {
  return t.acceptsChildren ? t.slots && !t.slots.includes(e.id) ? `<${t.id}> only takes ${Rr(t.slots)}, not <${e.id}>.` : e.parents && !e.parents.includes(t.id) ? `<${e.id}> only goes directly inside ${e.parents.map((n) => `<${n}>`).join(" or ")}, not <${t.id}>.` : null : `<${t.id}> cannot have children.`;
}
function Ea(t, e) {
  const n = t.slots;
  if (!n) return [];
  const o = [], r = /* @__PURE__ */ new Set();
  let s = -1;
  for (const i of e) {
    const a = n.indexOf(i);
    a !== -1 && (r.has(i) ? o.push(`<${t.id}> takes at most one <${i}>.`) : a < s && o.push(`<${t.id}>'s children go in the order ${Rr(n)}; <${i}> is out of place.`), r.add(i), s = Math.max(s, a));
  }
  return o;
}
function Rr(t) {
  return `${t.map((e) => `<${e}>`).join(", ")} (in that order, each at most once — any may be left out)`;
}
function ze(t) {
  var o;
  const e = Object.values(t.components), n = e.find((r) => r.id === "Stack" && r.acceptsChildren);
  return n ? n.id : ((o = e.find((r) => r.acceptsChildren && !r.parents)) == null ? void 0 : o.id) ?? null;
}
const Oa = [
  "colors",
  "spacing",
  "typography",
  "radius",
  "shadow",
  "gradients",
  "motion"
], Ca = /* @__PURE__ */ new Set(["spacing", "radius"]), yo = /(^|-)semantic(-|$)/, Na = /(^|-)(core|primitives?|palette|ref)(-|$)/;
function ja(t) {
  return Ca.has(t) ? "layout" : "core";
}
function Ra(t) {
  const e = {};
  for (const n of Oa) {
    const o = Object.keys(t[n] ?? {});
    if (!o.some((s) => yo.test(s))) continue;
    const r = {};
    for (const s of o)
      yo.test(s) ? r[s] = "semantic" : Na.test(s) && (r[s] = ja(n));
    e[n] = r;
  }
  return e;
}
const go = /* @__PURE__ */ new WeakMap();
function Rn(t) {
  if (t.tokenTiers) return t.tokenTiers;
  let e = go.get(t);
  return e || (e = { rule: Ge, tiers: Ra(t.tokens) }, go.set(t, e)), e;
}
function Ye(t, e, n) {
  var o;
  return (o = Rn(t).tiers[e]) == null ? void 0 : o[n];
}
function qe(t, e, n) {
  return typeof n == "string" && Ye(t, e, n) === "core";
}
function Ht(t, e) {
  return jn(t, e).filter((n) => Ye(t, e, n) !== "core");
}
function Pn(t, e, n) {
  const o = t.tokens[e] ?? {}, r = o[n];
  if (r === void 0) return [];
  const s = (i) => i.trim().toLowerCase() === r.trim().toLowerCase();
  return Object.keys(o).filter(
    (i) => i !== n && Ye(t, e, i) === "semantic" && s(o[i])
  );
}
const Z = {
  white: "#ffffff",
  gray: {
    50: "#f7f8fa",
    100: "#eef0f4",
    200: "#e2e5ec",
    300: "#cdd2dd",
    500: "#6b7280",
    900: "#12151d"
  },
  blue: {
    100: "#e6efff",
    500: "#2f6bff",
    600: "#1f52d6",
    700: "#173fa6"
  },
  green: {
    100: "#e2f6ea",
    500: "#1f9d55"
  },
  red: {
    100: "#fde7e7",
    500: "#e5484d",
    600: "#c62a2f"
  }
}, Ln = {
  none: "0px",
  "3xs": "4px",
  "2xs": "8px",
  xs: "12px",
  sm: "16px",
  md: "20px",
  lg: "24px",
  xl: "32px",
  "2xl": "40px",
  "3xl": "48px",
  "4xl": "64px",
  "5xl": "80px",
  "6xl": "96px"
}, Pr = {
  none: "0px",
  sm: "6px",
  md: "10px",
  lg: "16px",
  full: "9999px"
}, Pa = {
  xs: ["12px", "16px"],
  sm: ["14px", "20px"],
  md: ["16px", "24px"],
  lg: ["20px", "28px"],
  xl: ["24px", "32px"],
  "2xl": ["32px", "40px"]
}, La = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700"
}, Lr = {
  none: "none",
  sm: "0 1px 2px rgba(18, 21, 29, 0.08)",
  md: "0 4px 12px rgba(18, 21, 29, 0.10)",
  lg: "0 12px 32px rgba(18, 21, 29, 0.16)"
}, ae = {
  baseWidth: 1280,
  baseHeight: 720,
  upscale: 1.5,
  grid: 8,
  margin: 32,
  gutter: 16,
  offGridAllowed: [4, 12]
}, _e = {
  /** The tallest a card may be. */
  maxHeight: 456,
  /** Its inset on every side — the spacing step, so the smallest card is two of these. */
  inset: "lg",
  /**
   * Table Cell rows a tallest card's body holds under a header and a footer —
   * measured in the app on 2026-09-28 (8px between team and athlete rows, 24px athlete rows, flush scout rows), not derived: re-measure if a row, header or
   * footer token changes. The component's own JSDoc states the same numbers for
   * imported systems (held equal by catalog-storybook-parity.test.ts).
   */
  rowsAtMax: { team: 10, athlete: 10, scout: 7 }
}, Ft = Object.keys(Ln), Mr = Object.keys(Pr), Br = Object.keys(Lr), Dr = ["none", "surface", "subtle", "brand-subtle"], Fr = ["display", "title", "heading", "body", "caption"], Vr = ["default", "muted", "inverse", "brand"], qr = ["sm", "md", "lg"], Ur = ["primary", "secondary", "ghost", "danger"], Zr = ["vertical", "horizontal"], zr = ["start", "center", "end", "stretch"], Hr = ["start", "center", "end", "between"], Jr = {
  rule: "Every screen is three layers, bottom to top: the video (the live broadcast or a VOD still), the overlay that keeps the content legible, and the content. The overlay is never free-form: each screen type uses one fixed combination of shade pieces, set by where its components occupy the screen, and each screen sits on a navigation level that limits what it shows.",
  stack: [...yn],
  shades: {
    scrim: "--color-semantic-overlay-scrim",
    bottom: "--gradient-semantic-overlay-bottom",
    "bottom-right": "--gradient-semantic-overlay-bottom-right",
    "bottom-left": "--gradient-semantic-overlay-bottom-left",
    right: "--gradient-semantic-overlay-right",
    left: "--gradient-semantic-overlay-left",
    "top-right": "--gradient-semantic-overlay-top-right"
  },
  levels: [
    {
      level: 0,
      name: "Transmissão limpa",
      rootEnd: !0,
      rule: "The clean broadcast: only the video, plus at most one alert bug or one notification. No menu, no rail.",
      maxModules: 1,
      allowsAnchor: !1
    },
    {
      level: 1,
      name: "Home",
      rootColumn: !0,
      rule: "The first navigation level, right after login: the main menu and the content rail. Everything on screen is reachable, and the channel logo leads back to the clean broadcast.",
      maxModules: null,
      allowsAnchor: !0,
      initialFocus: {
        on: ["MainMenu"],
        hint: "Focus starts on the main menu — on the program button by default; when the Home rail sits on the left, on the left button that owns it (miscellaneous, schedule or login). A focus on an interactivity button would already be the second level."
      }
    },
    {
      level: 2,
      name: "Trilho focado",
      rootEnd: !0,
      rule: "The second level: the viewer moved up into a content rail (or focused login, schedule or miscellaneous). The rest of the menu is hidden and the screen is cleared around that one rail.",
      maxModules: 1,
      allowsAnchor: !0,
      initialFocus: {
        on: ["InteractivityButton"],
        required: !0,
        hint: "Focus is on one of the interactivity buttons — that is what makes this the second level, a page of its own; the main menu is not on screen."
      }
    },
    {
      level: 3,
      name: "Interatividade única",
      rootEnd: !0,
      rule: "The third level: one interactivity needs more room (statistics, a line-up, a VOD page). Every other element is cleared; only that interactivity remains, with its close button as the anchored cluster.",
      maxModules: 1,
      allowsAnchor: !0,
      initialFocus: {
        anchored: !0,
        on: ["CloseButton", "RoundedButton"],
        required: !0,
        hint: "Focus starts on the rounded button (the anchored close/back control), not on the interactivity itself. The content card is focusable — the viewer moves the focus onto it from the rounded button."
      }
    }
  ],
  menu: {
    component: "MainMenu",
    prop: "focusedItem",
    initial: "program",
    roles: [
      { item: "program", name: "Program", side: "right", holds: "interactivities about the programme on air — its own context (statistics, votes, extras)" },
      { item: "miscellaneous", name: "Miscellaneous", side: "left", holds: "various types of interactivities, not tied to the programme" },
      { item: "schedule", name: "Schedule", side: "left", holds: "the schedule: one card per programme, with its time (overline), whether it is live (the live badge) and its name (title)" },
      { item: "login", name: "Login", side: "left", holds: "account settings" }
    ]
  },
  links: {
    none: ["MainMenu"],
    back: ["RoundedButton"],
    close: ["CloseButton"]
  },
  models: [
    {
      id: "alert",
      name: "Alerta",
      level: 0,
      side: "right",
      shades: ["bottom-right"],
      use: "An interactivity alert bug in the bottom-right corner of the clean broadcast."
    },
    {
      id: "notification",
      name: "Notificação",
      level: 0,
      side: "right",
      shades: ["top-right"],
      // The UI Kit's level 0 (Camadas e profundidade › Camadas, 6441:15738): the notification is always in the top-right corner.
      allowsRootStart: !0,
      use: 'A notification in the top-right corner of the clean broadcast — the one overlay without the scrim. It is always in the top-right corner, so its stack starts at the top of the frame (justify "start").'
    },
    {
      id: "home",
      name: "Home",
      level: 1,
      shades: ["scrim", "bottom", "bottom-right", "bottom-left"],
      use: "The home screen: the main menu along the bottom, with content on both sides."
    },
    {
      id: "home-notification",
      name: "Home + Notificação",
      level: 1,
      shades: ["scrim", "bottom", "top-right", "bottom-right", "bottom-left"],
      use: "The home screen while a notification shows in the top-right corner."
    },
    {
      id: "home-buttons-right",
      name: "Home · Botões Direita",
      level: 1,
      side: "right",
      shades: ["scrim", "bottom", "bottom-right"],
      use: "The home screen with its buttons grouped on the right."
    },
    {
      id: "home-buttons-left",
      name: "Home · Botões Esquerda",
      level: 1,
      side: "left",
      shades: ["scrim", "bottom", "bottom-left"],
      use: "The home screen with its buttons grouped on the left."
    },
    {
      id: "home-buttons-right-notification",
      name: "Home · Botões Direita + Notificação",
      level: 1,
      side: "right",
      shades: ["scrim", "bottom", "top-right", "bottom-right"],
      use: "The home screen with its rail on the right (the program rail) while a notification shows in the top-right corner — nothing on the left."
    },
    {
      id: "home-buttons-left-notification",
      name: "Home · Botões Esquerda + Notificação",
      level: 1,
      side: "left",
      shades: ["scrim", "bottom", "top-right", "bottom-left"],
      use: "The home screen with its rail on the left (miscellaneous, schedule or login) while a notification shows in the top-right corner."
    },
    {
      id: "interactivity-buttons-right",
      name: "Interatividades · Botões Direita",
      level: 2,
      side: "right",
      shades: ["scrim", "bottom-right", "bottom"],
      use: "A focused rail of interactivity buttons along the bottom, on the right."
    },
    {
      id: "interactivity-buttons-left",
      name: "Interatividades · Botões Esquerda",
      level: 2,
      side: "left",
      shades: ["scrim", "bottom-left", "bottom"],
      use: "A focused rail of interactivity buttons along the bottom, on the left."
    },
    {
      id: "interactivity-cards-right",
      name: "Interatividades · Cards Direita",
      level: 3,
      side: "right",
      shades: ["scrim", "bottom-right", "right"],
      use: "A single interactivity card or panel on the right (statistics, a line-up)."
    },
    {
      id: "interactivity-cards-left",
      name: "Interatividades · Cards Esquerda",
      level: 3,
      side: "left",
      shades: ["scrim", "bottom-left", "left"],
      use: "A single interactivity card or panel on the left."
    }
  ]
}, Ma = "home";
function U(t) {
  return t.screenLayers ?? Jr;
}
function Ke(t, e) {
  return typeof e == "string" ? t.models.find((n) => n.id === e) : void 0;
}
const we = "composed";
function Mn(t, e) {
  const n = `one or more of ${Ve.map((s) => `"${s}"`).join(", ")}, each at most once`;
  if (e.model !== we) return `"shades" only goes with "model": "${we}" — a layer model already has its own shades.`;
  if (!bt(t, e.level)) return `a composed overlay names its level: one of ${t.levels.map((s) => s.level).join(", ")}.`;
  const o = e.shades;
  if (!Array.isArray(o) || o.length === 0) return `a composed overlay lists its "shades": ${n}.`;
  const r = o.filter((s) => !Ve.includes(s));
  return r.length > 0 ? `${r.map((s) => JSON.stringify(s)).join(", ")} ${r.length === 1 ? "is" : "are"} not a shade piece — use ${n}.` : new Set(o).size !== o.length ? `a shade piece is listed twice — use ${n}.` : null;
}
function $e(t, e) {
  if (ne(e))
    return e.model === we && Mn(t, e) === null ? {
      id: we,
      name: "Composed overlay",
      level: e.level,
      shades: [...e.shades],
      use: "A screen that composes its own overlay from the shade pieces (Exploratory, declared)."
    } : Ke(t, e.model);
}
function bt(t, e) {
  return t.levels.find((n) => n.level === e);
}
function Ba(t) {
  const e = Ke(t, Ma) ?? t.models[0];
  return e ? { model: e.id, level: e.level } : null;
}
function ne(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
const Wr = /* @__PURE__ */ new Set(["start", "flex-start", "left"]), Gr = /* @__PURE__ */ new Set(["end", "flex-end", "right"]);
function wt(t, e) {
  const n = typeof e.type == "string" ? t.components[e.type] : void 0;
  if (!n) return null;
  const r = ((d) => {
    const u = n.props[d];
    if (!u) return;
    const y = ne(e.props) ? e.props : {};
    return d in y ? y[d] : Ze(u);
  })("direction"), s = r === "horizontal" || r === "row" ? "justify" : "align", i = n.props[s];
  if (!i) return null;
  const a = i.options ?? [], l = a.find((d) => Wr.has(d)) ?? "start", c = a.find((d) => Gr.has(d)) ?? "end";
  return { prop: s, values: { left: l, right: c } };
}
function Bn(t, e) {
  const n = wt(t, e);
  if (!n) return null;
  const o = t.components[e.type], r = ne(e.props) ? e.props : {}, s = n.prop in r ? r[n.prop] : Ze(o.props[n.prop]);
  return typeof s != "string" ? null : Wr.has(s) ? "left" : Gr.has(s) ? "right" : null;
}
function Da(t, e) {
  const o = (Array.isArray(e.children) ? e.children.filter(ne) : []).filter((i) => i.anchor !== !0).at(-1);
  if (!o || typeof o.type != "string") return null;
  const r = Bn(t, o), s = wt(t, o);
  return r && s ? { side: r, prop: s.prop, type: o.type, values: s.values } : null;
}
const Fa = /^(surface|background|bg|backgroundColor|fill)$/i, Va = ["none", "transparent"];
function Jt(t, e) {
  var o;
  const n = typeof e.type == "string" ? t.components[e.type] : void 0;
  if (!n) return null;
  for (const r of Object.values(n.props)) {
    if (!Fa.test(r.name)) continue;
    const s = (o = r.options) == null ? void 0 : o.find((i) => Va.includes(i));
    if (s) return { prop: r.name, clear: s };
  }
  return null;
}
function Yr(t, e) {
  const n = Jt(t, e);
  if (!n) return null;
  const o = t.components[e.type], r = ne(e.props) ? e.props : {}, s = n.prop in r ? r[n.prop] : Ze(o.props[n.prop]);
  return s === n.clear ? null : String(s);
}
function nn(t) {
  return t.models.map((e) => `"${e.id}" (level ${e.level})`).join(", ");
}
function qa(t, e) {
  const n = U(e);
  if (n.models.length === 0) return [];
  const o = ne(t) ? t : {}, r = ne(o.root) ? o.root : void 0, s = o.screen ?? (r == null ? void 0 : r.screen), i = [], a = (g, b, S) => {
    i.push({ ruleId: g, path: b, message: S });
  };
  if (s === void 0)
    return [
      {
        ruleId: "layers.overlay-model",
        path: ["screen"],
        message: `The screen names no layer model. Add "screen": { "model": …, "level": … } next to "root" — one of ${nn(n)}.`
      }
    ];
  if (!ne(s))
    return [{ ruleId: "blueprint.dsl", path: ["screen"], message: '"screen" must be an object: { "model": …, "level": … }.' }];
  const l = $e(n, s);
  if (!l)
    return [
      {
        ruleId: "layers.overlay-model",
        path: ["screen", "model"],
        message: `screen.model ${JSON.stringify(s.model)} is not a layer model. Use one of ${nn(n)}.`
      }
    ];
  l.id === we && a(
    "layers.overlay-model",
    ["screen", "model"],
    `The screen composes its own overlay (${l.shades.join(" + ")}) instead of using one of ${nn(n)}.`
  );
  const c = bt(n, l.level);
  if (s.level !== l.level && a(
    "layers.overlay-model",
    ["screen", "level"],
    `screen.level ${JSON.stringify(s.level)} doesn't match "${l.id}" (${l.name}), a level ${l.level} screen${c ? ` (${c.name})` : ""} — set "level": ${l.level}, or pick a model on level ${JSON.stringify(s.level)}.`
  ), !r) return i;
  const d = Yr(e, r), u = Jt(e, r);
  d !== null && u && a(
    "layers.stack",
    ["root", "props", u.prop],
    `The content layer is transparent — the engine paints the video and the overlay under it, so the outermost container sets ${u.prop} "${u.clear}" (got ${JSON.stringify(d)}). Give surfaces to the cards inside it instead.`
  );
  const y = Array.isArray(r.children) ? r.children : [], p = y.filter(ne), f = p.filter((g) => g.anchor !== !0), h = p.length - f.length;
  if (c && c.maxModules !== null && f.length > c.maxModules && a(
    "level.module-limit",
    ["root"],
    `A level ${c.level} screen (${c.name}) shows ${c.maxModules === 1 ? "a single content module" : `at most ${c.maxModules} content modules`}: the outermost container has ${f.length} un-anchored children — group them into one container, or pick a level 1 model. ${c.rule}`
  ), (c == null ? void 0 : c.level) === 1) {
    const g = Xr(e, r), b = n.menu;
    if (g && b && !g.allowed.includes(String(g.found))) {
      const S = g.railSide === "left" ? "the Home rail is on the left, so the focus is on the left button that owns it" : "the focus starts on the program button (its rail, the programme's context, is on the right)";
      a(
        "level.initial-focus",
        ["root"],
        `<${b.component}> ${b.prop} ${JSON.stringify(g.found)} — ${S}: use ${g.allowed.map((R) => JSON.stringify(R)).join(" or ")}.`
      );
    }
  }
  const m = Kr(e);
  if (y.forEach((g, b) => {
    ne(g) && g.anchor === !0 && typeof g.type == "string" && m.has(g.type) && a(
      "layout.anchor-structure",
      ["root", "children", b, "anchor"],
      `<${g.type}> is anchored — it holds the screen's focus in the content, so it never floats in the anchored corner. Remove "anchor" from it; anchor only a secondary cluster.`
    );
  }), c && !c.allowsAnchor && h > 0 && a("layout.anchor", ["root"], `A level ${c.level} screen (${c.name}) anchors nothing — remove "anchor". ${c.rule}`), l.side) {
    const g = Bn(e, r), b = wt(e, r);
    g && b && g !== l.side && a(
      "layers.overlay-model",
      ["root", "props", b.prop],
      `"${l.id}" (${l.name}) shades the ${l.side} side, but the outermost container puts its content on the ${g} — set ${b.prop} "${b.values[l.side]}", or pick a ${g} model.`
    );
    const S = g ? null : Da(e, r);
    S && S.side !== l.side && a(
      "layers.overlay-model",
      ["root"],
      `"${l.id}" (${l.name}) shades the ${l.side} side, but the <${S.type}> puts its content on the ${S.side} — set its ${S.prop} "${S.values[l.side]}", or pick a ${S.side} model.`
    );
  }
  return i;
}
function Kr(t) {
  const e = /* @__PURE__ */ new Set();
  for (const n of U(t).levels)
    n.initialFocus && !n.initialFocus.anchored && n.initialFocus.on.forEach((o) => e.add(o));
  return e;
}
function Ua(t, e) {
  const n = (o, r) => {
    if (e(o, r), Array.isArray(o.children))
      for (const s of o.children) ne(s) && n(s, o);
  };
  n(t, null);
}
function Xr(t, e) {
  var y, p;
  const n = U(t), o = n.menu;
  if (!o || !t.components[o.component]) return null;
  const r = ((p = (y = n.levels.find((f) => f.level === 2)) == null ? void 0 : y.initialFocus) == null ? void 0 : p.on) ?? [];
  let s = null, i = null;
  if (Ua(e, (f, h) => {
    f.type === o.component && !s && (s = f), typeof f.type == "string" && r.includes(f.type) && h && !i && (i = h);
  }), !s) return null;
  const a = t.components[o.component], l = ne(s.props) ? s.props : {}, c = o.prop in l ? l[o.prop] : Ze(a.props[o.prop]), d = i ? Bn(t, i) : null, u = d === "left" ? o.roles.filter((f) => f.side === "left").map((f) => f.item) : [o.initial];
  return { menu: s, found: c, railSide: d, allowed: u };
}
const Wt = ["primitive:Box", "primitive:Stack", "primitive:Text"], Ue = "Proposal", ft = 3, mt = 6, Dn = [...Wt, Ue], yt = (t) => typeof t == "string" && Wt.includes(t), Me = (t, e = {}) => ({
  name: t,
  type: { name: "string" },
  required: !1,
  ...e
});
function Le(t, e, n, o) {
  const r = Ht(t, n), s = o ? r.filter((i) => o.test(i)) : void 0;
  return r.length === 0 || o && s.length === 0 ? [] : [Me(e, { tokenGroup: n, description: `a ${n} token`, ...s ? { options: s } : {} })];
}
const Ot = (t) => Object.fromEntries(t.map((e) => [e.name, e]));
function Za(t) {
  const e = Me("align", { type: { name: "enum" }, options: ["start", "center", "end", "stretch"] }), n = Me("justify", { type: { name: "enum" }, options: ["start", "center", "end", "between"] });
  return {
    "primitive:Box": {
      id: "primitive:Box",
      name: "Box (primitive)",
      category: "primitive",
      description: 'A surface: padding, background and radius from the system’s tokens. Exploratory only, with "reuse".',
      acceptsChildren: !0,
      props: Ot([
        ...Le(t, "padding", "spacing"),
        ...Le(t, "background", "colors"),
        ...Le(t, "radius", "radius")
      ])
    },
    "primitive:Stack": {
      id: "primitive:Stack",
      name: "Stack (primitive)",
      category: "primitive",
      description: 'A flex row or column. Exploratory only, with "reuse".',
      acceptsChildren: !0,
      props: Ot([
        Me("direction", { type: { name: "enum" }, options: ["vertical", "horizontal"], defaultValue: "vertical" }),
        ...Le(t, "gap", "spacing"),
        e,
        n
      ])
    },
    "primitive:Text": {
      id: "primitive:Text",
      name: "Text (primitive)",
      category: "primitive",
      description: 'A run of text: color, size and weight from the system’s tokens. Exploratory only, with "reuse".',
      acceptsChildren: !1,
      props: Ot([
        Me("text", { required: !0, description: "the words" }),
        ...Le(t, "color", "colors"),
        ...Le(t, "size", "typography", /size/i),
        ...Le(t, "weight", "typography", /weight/i)
      ])
    },
    [Ue]: {
      id: Ue,
      name: "Proposal",
      category: "proposal",
      description: "A component the registry lacks: what it is and the props it would take. A placeholder — never built as the real thing. Exploratory only.",
      acceptsChildren: !1,
      props: Ot([
        Me("description", { required: !0, description: "what the component is and does" }),
        Me("proposedApi", { type: { name: "object" }, required: !0, description: "prop name → short type or description" })
      ])
    }
  };
}
const vo = /* @__PURE__ */ new WeakMap();
function $t(t) {
  let e = vo.get(t);
  return e || (e = { ...t, components: { ...t.components, ...Za(t) } }, vo.set(t, e)), e;
}
function za(t, e) {
  const n = Object.values(t.components).filter((s) => !Dn.includes(s.id)), o = [], r = [];
  for (const s of e.split(/[,;/]|\s+(?:e|and|ou|or)\s+/i).map((i) => i.trim().replace(/^<|>$/g, "")).filter(Boolean)) {
    const i = n.find((a) => a.id.toLowerCase() === s.toLowerCase() || a.name.toLowerCase() === s.toLowerCase());
    i ? o.push(i.id) : r.push(s);
  }
  return { found: [...new Set(o)], unknown: r };
}
function Qr(t, e) {
  const n = 'every primitive carries "reuse": { "considered": "<registry components you looked at, by id, comma-separated>", "why": "<why none of them expresses the need>" }';
  if (e === void 0) return `a primitive has no "reuse" — ${n}.`;
  if (typeof e != "object" || e === null || Array.isArray(e)) return `"reuse" is not an object — ${n}.`;
  const { considered: o, why: r, ...s } = e;
  if (Object.keys(s).length > 0 || typeof o != "string" || typeof r != "string")
    return `"reuse" must be exactly { "considered", "why" }${Object.keys(s).length ? ` (remove "${Object.keys(s).join('", "')}")` : ""} — ${n}.`;
  if (r.trim().length === 0 || r.length > 300) return 'the "why" of "reuse" must say in one short sentence (up to 300 characters) why no registry component expresses the need.';
  const { found: i, unknown: a } = za(t, o), l = Object.values(t.components).filter((c) => !Dn.includes(c.id)).map((c) => c.id);
  return a.length > 0 ? `"reuse".considered names ${a.map((c) => `"${c}"`).join(", ")}, which ${a.length === 1 ? "is" : "are"} not a component of ${t.name}. Name the components you looked at, by id: ${l.join(", ")}.` : i.length === 0 ? `"reuse".considered names no component. Name the components you looked at, by id: ${l.join(", ")}.` : null;
}
const bo = '{ "type": "Proposal", "props": { "description": "<what the component is>", "proposedApi": { "<prop>": "<type>" } }, "deviation": { "ruleId": "registry.new-component", "why": "<why the registry lacks it>" } }';
function es(t) {
  const e = [];
  let n = 0;
  const o = (r, s, i) => {
    const a = yt(r.type) ? i + 1 : 0;
    yt(r.type) && (n += 1), a === ft + 1 && e.push({
      ruleId: "primitives.budget",
      kind: "budget-exceeded",
      path: s,
      message: `<${r.type}> is primitive number ${a} in a chain of primitives inside primitives — at most ${ft}. A structure this deep is a component the registry lacks: replace the chain with one Proposal, ${bo}.`
    }), r.children.forEach((l, c) => o(l, [...s, "children", c], a));
  };
  return o(t, ["root"], 0), n > mt && e.unshift({
    ruleId: "primitives.budget",
    kind: "budget-exceeded",
    path: ["root"],
    message: `The screen uses ${n} primitives — at most ${mt}, text included. Use registry components where one fits, and group the rest into a Proposal, ${bo}.`
  }), e;
}
const { baseWidth: wo, baseHeight: $o, grid: ko, margin: xo, gutter: _o } = ae, ts = [
  // ── Laws ──────────────────────────────────────────────────────────────────
  {
    id: "tokens.only",
    title: "Tokens only",
    statement: "A design value is always a token name — never a raw hex, rgb, px, rem or % value.",
    flexibility: "law",
    category: "tokens",
    source: "manifest-zod.ts"
  },
  {
    id: "tokens.semantic-tier",
    title: "Semantic tier, never core",
    statement: "A screen names semantic (or layout) tokens; core tokens exist only for other tokens to point at.",
    flexibility: "law",
    category: "tokens",
    source: "manifest-zod.ts"
  },
  {
    id: "grid.8pt",
    title: `${ko}pt grid`,
    statement: `Every spacing and every grid-bound size is a multiple of ${ko}pt (the documented exceptions aside).`,
    flexibility: "law",
    category: "grid",
    source: "frame.ts"
  },
  {
    id: "frame.layout",
    title: `Frame ${wo}×${$o}, margin ${xo}, gutter ${_o}`,
    statement: `The layout is ${wo}×${$o} with a ${xo}pt safe-area margin the frame applies itself; the root is the layout container and adds no margin; top-level modules and stacked columns sit exactly ${_o}pt apart.`,
    flexibility: "law",
    category: "frame",
    source: "frame.ts"
  },
  {
    id: "layers.stack",
    title: "Video, overlay, content",
    statement: "Every screen is three layers — video, overlay, content. The content layer is transparent: the outermost container paints no background.",
    flexibility: "law",
    category: "layers",
    source: "screen-layers.ts"
  },
  {
    id: "focus.single",
    title: "One focus per screen",
    statement: "A TV screen has exactly one focused element — the one the viewer is on.",
    flexibility: "law",
    category: "focus",
    source: "frame.ts"
  },
  {
    id: "component.api",
    title: "Component API",
    statement: "Only real components, with their declared props and allowed values; children only on components that accept them, as a list of nodes.",
    flexibility: "law",
    category: "component",
    source: "manifest-zod.ts"
  },
  {
    id: "blueprint.dsl",
    title: "Blueprint DSL shape",
    statement: "Only the keys the Blueprint DSL defines, version 1, at most 6 screens with unique ids, at most 4 short notes, and every goTo names another screen of the document.",
    flexibility: "law",
    category: "dsl",
    source: "blueprint.ts"
  },
  {
    id: "layout.anchor-structure",
    title: "Anchor structure",
    statement: "Only a direct child of the root can be anchored, and never the component that holds a level’s focus in the content.",
    flexibility: "law",
    category: "layout",
    source: "frame.ts"
  },
  {
    id: "primitives.reuse",
    title: "A primitive says why no component would do",
    statement: 'Every primitive carries "reuse": the registry components it considered, by name, and why none of them expresses the need.',
    flexibility: "law",
    category: "registry",
    source: "primitives.ts",
    appliesTo: ["primitive:Box", "primitive:Stack", "primitive:Text"]
  },
  {
    id: "primitives.budget",
    title: "Primitive budget",
    statement: `At most ${ft} primitives in a chain (a primitive inside a primitive) and ${mt} per screen, text included; beyond that the need is a new component — a Proposal.`,
    flexibility: "law",
    category: "registry",
    source: "primitives.ts",
    appliesTo: ["primitive:Box", "primitive:Stack", "primitive:Text"]
  },
  // ── Patterns ──────────────────────────────────────────────────────────────
  {
    id: "layers.overlay-model",
    title: "Overlay models",
    statement: "Every screen names one of the fixed layer models, on that model’s level, with its content on the side the model shades.",
    flexibility: "pattern",
    category: "layers",
    source: "screen-layers.ts"
  },
  {
    id: "level.module-limit",
    title: "Module limit per level",
    statement: "A navigation level shows at most its number of content modules (one on levels 0, 2 and 3).",
    flexibility: "pattern",
    category: "level",
    source: "screen-layers.ts"
  },
  {
    id: "level.root-direction",
    title: "Root direction per level",
    statement: "On levels that require it, the outermost container is a column; on levels whose stack sits at the end of the frame, it is justified to the end.",
    flexibility: "pattern",
    category: "level",
    source: "frame.ts"
  },
  {
    id: "level.initial-focus",
    title: "Where focus starts",
    statement: "Each level starts its focus on its own component: the main menu on Home, an interactivity button on level 2, the rounded or close button on level 3.",
    flexibility: "pattern",
    category: "level",
    source: "frame.ts",
    appliesTo: ["MainMenu", "InteractivityButton", "CloseButton", "RoundedButton"]
  },
  {
    id: "flow.next-level",
    title: "Links from N to N+1",
    statement: "A link opens the next level or goes back up — it never skips a level.",
    flexibility: "pattern",
    category: "flow",
    source: "flow.ts"
  },
  {
    id: "flow.link-roles",
    title: "Link roles",
    statement: "The main menu carries no link; a back control returns exactly one level; a close control returns to Home.",
    flexibility: "pattern",
    category: "flow",
    source: "flow.ts",
    appliesTo: ["MainMenu", "RoundedButton", "CloseButton"]
  },
  {
    id: "flow.rail-consistency",
    title: "Rail consistency",
    statement: "A second-level page shows as many interactivity buttons as the Home rail it is entered from.",
    flexibility: "pattern",
    category: "flow",
    source: "flow.ts",
    appliesTo: ["InteractivityButton"]
  },
  {
    id: "layout.slots",
    title: "Slots, order and parents",
    statement: "A component with slots takes each slot at most once, in slot order; a component with parents goes only directly inside them.",
    flexibility: "pattern",
    category: "layout",
    source: "manifest.ts",
    appliesTo: ["ContentCard", "ContentCardHeader", "ContentCardBody", "ContentCardFooter", "TableCell"]
  },
  {
    id: "layout.root-align",
    title: "Root with align: stretch",
    statement: "The stack that holds the components always stretches; a module places itself inside it.",
    flexibility: "pattern",
    category: "layout",
    source: "frame.ts"
  },
  {
    id: "layout.no-static-center",
    title: "No static centering",
    statement: "The master layout is never statically centered — TV layouts follow the focus.",
    flexibility: "pattern",
    category: "layout",
    source: "frame.ts"
  },
  {
    id: "layout.anchor",
    title: "One anchored group",
    statement: "A frame anchors at most one element group, and only on levels that allow an anchor.",
    flexibility: "pattern",
    category: "layout",
    source: "frame.ts"
  },
  {
    id: "registry.new-component",
    title: "Catalog components only",
    statement: "A screen is built from the catalog; a component the registry lacks is a declared Proposal (a description and its proposed props), never an invented one.",
    flexibility: "pattern",
    category: "registry",
    source: "primitives.ts",
    appliesTo: ["primitive:Box", "primitive:Stack", "primitive:Text", "Proposal"]
  },
  // ── Conventions ───────────────────────────────────────────────────────────
  {
    id: "templates.reference",
    title: "Reference screens",
    statement: "A generation starts from the reference screen whose shape the plan describes.",
    flexibility: "convention",
    category: "templates",
    source: "rules.ts"
  },
  {
    id: "copy.button-label",
    title: "Button labels say what they do",
    statement: "A button label names the action it performs.",
    flexibility: "convention",
    category: "copy",
    source: "rules.ts",
    appliesTo: ["Button", "WideButton", "InteractivityButton"]
  },
  {
    id: "render.legibility",
    title: "Legible text",
    statement: "Text never lands on top of other text and is never squeezed to nothing by a container too small for it.",
    flexibility: "convention",
    category: "frame",
    source: "renderAudit.ts"
  }
];
function kt(t) {
  return t.rules ?? ts;
}
function Ha(t, e) {
  return kt(t).filter((n) => {
    var o;
    return (o = n.appliesTo) == null ? void 0 : o.some((r) => e.includes(r));
  });
}
function gt(t, e) {
  return kt(t).find((n) => n.id === e);
}
const vn = 300, Ja = " In an Exploratory screen either fix this, or declare it:", Wa = {
  "layout.slots": "node",
  "flow.next-level": "node",
  "flow.link-roles": "node",
  "flow.rail-consistency": "screen",
  "level.module-limit": "screen",
  "level.root-direction": "screen",
  "level.initial-focus": "screen",
  "layout.root-align": "screen",
  "layout.no-static-center": "screen",
  "layout.anchor": "screen",
  // Reported on the screen itself (["screen", …]), not under the root: only the screen's own list covers it.
  "layers.overlay-model": "screen",
  // A Proposal is the break, at its own node.
  "registry.new-component": "node"
}, Vt = (t) => Wa[t] ?? "screen";
function ns(t) {
  return kt(t).filter((e) => e.flexibility === "pattern");
}
function xt(t, e, n = "node") {
  if (typeof e != "object" || e === null || Array.isArray(e))
    return '"deviation" must be { "ruleId": "<rule id>", "why": "<the reason>" }.';
  const { ruleId: o, why: r, ...s } = e, i = Object.keys(s);
  if (typeof o != "string" || o.length === 0 || typeof r != "string" || i.length > 0)
    return `"deviation" must be exactly { "ruleId": "<rule id>", "why": "<the reason>" }${i.length > 0 ? ` (remove "${i.join('", "')}")` : ""}.`;
  if (r.trim().length === 0 || r.length > vn)
    return `the "why" of the deviation from "${o}" must say in one short sentence (up to ${vn} characters) why the pattern is broken.`;
  const a = gt(t, o);
  return a ? a.flexibility === "law" ? `"${o}" (${a.title}) is a law — it holds in every mode and cannot be declared as a deviation.` : a.flexibility === "convention" ? `"${o}" (${a.title}) is a convention — breaking it only produces a note, so it needs no declaration.` : n === "screen" && Vt(o) === "node" ? `"${o}" (${a.title}) breaks at one node, so it is declared on that node — put "deviation" on the node where it happens, not on the screen.` : null : `"${o}" is not a rule of ${t.name}. Declare one of: ${ns(t).map((l) => l.id).join(", ")}.`;
}
function os(t, e, n, o) {
  const r = (a, l) => xt(t, a, l) === null && a.ruleId === o, s = typeof e == "object" && e !== null && r(e.deviation, "node"), i = typeof n == "object" && n !== null ? n.deviation : void 0;
  return s || Array.isArray(i) && i.some((a) => r(a, "screen"));
}
const Ga = (t, e) => e.length <= t.length && e.every((n, o) => n === t[o]);
function Ya(t, e, n) {
  const o = t.filter((s) => s.ruleId === e);
  return o.filter((s) => s.scope === "node" && Ga(n, s.path)).sort((s, i) => i.path.length - s.path.length)[0] ?? o.find((s) => s.scope === "screen");
}
function So(t, e) {
  const n = [], o = (r, s) => {
    r.deviation && n.push({ ...r.deviation, path: s, scope: "node", at: [...s, "deviation"] }), (r.children ?? []).forEach((i, a) => o(i, [...s, "children", a]));
  };
  return o(t, ["root"]), ((e == null ? void 0 : e.deviation) ?? []).forEach((r, s) => n.push({ ...r, path: [], scope: "screen", at: ["screen", "deviation", s] })), n;
}
function Ka(t, e, n) {
  return rs(t, e, n).errors;
}
function rs(t, e, n) {
  const o = /* @__PURE__ */ new Set(), r = [], s = [];
  for (const i of t) {
    const a = gt(n, i.ruleId);
    if (!a || a.flexibility === "law")
      r.push(i);
    else if (a.flexibility === "pattern") {
      const l = Ya(e, i.ruleId, i.path);
      l ? (o.add(l), s.push(i)) : r.push({
        ...i,
        kind: "undeclared-deviation",
        message: `${i.message}${Ja} "deviation": { "ruleId": "${i.ruleId}", "why": "…" } on the node where it happens (or in "screen".deviation for the whole screen).`
      });
    }
  }
  for (const i of e) {
    if (o.has(i)) continue;
    const a = gt(n, i.ruleId);
    r.push({
      ruleId: "blueprint.dsl",
      kind: "unused-deviation",
      path: i.at,
      message: `A deviation from "${i.ruleId}"${a ? ` (${a.title})` : ""} is declared ${i.scope === "screen" ? "on the screen" : "here"}, but nothing ${i.scope === "screen" ? "on it" : "under it"} breaks that rule — remove the declaration, or make the break it describes.`
    });
  }
  return { errors: r, covered: s };
}
function Xa(t, e) {
  var o;
  let n = t;
  for (let r = 1; r + 1 < e.length && e[r] === "children"; r += 2) {
    const s = (o = n.children) == null ? void 0 : o[Number(e[r + 1])];
    if (!s) break;
    n = s;
  }
  return n.deviation;
}
function Qa(t, e) {
  var r, s;
  const n = typeof t == "object" && t !== null ? t : {}, o = [];
  for (const i of e) {
    if (i.kind !== "undeclared-deviation" || Vt(i.ruleId) !== "node") continue;
    const [a, l] = i.path[0] === "screens" ? [(s = (r = n.screens) == null ? void 0 : r[Number(i.path[1])]) == null ? void 0 : s.root, i.path.slice(2)] : [n.root, i.path], c = a && Xa(a, l);
    if (!c || c.ruleId === i.ruleId || Vt(c.ruleId) !== "node") continue;
    let d = 1;
    for (; d + 1 < l.length && l[d] === "children"; ) d += 2;
    o.push({ path: [...i.path.slice(0, i.path.length - l.length), ...l.slice(0, d)], declared: c.ruleId, broken: i.ruleId });
  }
  return o;
}
const E = {
  /** The layout canvas — what the agent targets and the frame is laid out at. */
  base: { width: ae.baseWidth, height: ae.baseHeight },
  upscale: ae.upscale,
  grid: ae.grid,
  margin: ae.margin,
  gutter: ae.gutter,
  offGridAllowed: ae.offGridAllowed
}, el = "1080p";
function To(t, e, n) {
  const o = E.base.width * e, r = E.base.height * e;
  return { id: t, width: o, height: r, label: `${o}×${r}`, description: n, scale: e };
}
const tl = {
  "1080p": To(
    "1080p",
    E.upscale,
    `${E.base.width}×${E.base.height} upscaled ${E.upscale}×`
  ),
  "720p": To("720p", 1, "HD base")
}, nl = 16;
function ol(t) {
  if (typeof t == "number") return Number.isFinite(t) ? t : null;
  if (typeof t != "string") return null;
  const e = t.trim().match(/^(\d*\.?\d+)(px|rem)?$/);
  if (!e) return null;
  const n = Number(e[1]);
  return e[2] === "rem" ? n * nl : n;
}
function Be(t) {
  return t % E.grid === 0 || E.offGridAllowed.includes(t);
}
function _t() {
  const t = E.offGridAllowed.map((e) => `${e}px`).join(" and ");
  return `a multiple of ${E.grid}px (${t} are the only exceptions)`;
}
function ue(t, e) {
  if (typeof e != "string") return null;
  const n = t.tokens.spacing ?? {};
  return Object.prototype.hasOwnProperty.call(n, e) ? ol(n[e]) : null;
}
function Gt(t, e) {
  const n = ue(t, e);
  return n !== null && !Be(n);
}
function rt(t, e) {
  const n = e.filter((o) => !Gt(t, o));
  return n.length > 0 ? n : [...e];
}
function Ie(t, e) {
  const n = e.options && e.options.length > 0 ? e.options : jn(t, "spacing");
  return rt(t, n);
}
function Ee(t, e, n) {
  return e.find((o) => ue(t, o) === n);
}
function rl(t, e, n) {
  const o = rt(t, e);
  if (typeof n == "string" && o.includes(n)) return n;
  const r = ue(t, n);
  if (r === null) return o[0];
  let s, i = Number.POSITIVE_INFINITY;
  for (const a of o) {
    const l = ue(t, a);
    if (l === null) continue;
    const c = Math.abs(l - r);
    c < i && (s = a, i = c);
  }
  return s ?? o[0];
}
const sl = {
  gutter: /gap|gutter|spacing/i,
  margin: /padding|inset/i
};
function Oe(t, e) {
  return Object.values(t.props).find(
    (n) => n.tokenGroup === "spacing" && sl[e].test(n.name)
  );
}
function Fn(t) {
  return Object.values(t.props).filter(
    (e) => /align|justify/i.test(e.name) && (!e.options || e.options.includes("center"))
  );
}
function St(t) {
  return Object.values(t.props).find(
    (e) => {
      var n;
      return /^align(Items)?$/i.test(e.name) && ((n = e.options) == null ? void 0 : n.includes("stretch"));
    }
  );
}
function ss(t) {
  return !t.options || t.options.includes("start") ? "start" : t.options.find((e) => e !== "center") ?? "start";
}
const is = /* @__PURE__ */ new Set(["none", "null", ""]);
function Vn(t) {
  return Object.values(t.props).filter(
    (e) => {
      var n;
      return ((n = e.options) == null ? void 0 : n.includes("focus")) || /^focus/i.test(e.name);
    }
  );
}
function Tt(t) {
  var e, n;
  return (e = t.options) != null && e.includes("focus") ? t.options.find((o) => o === "default") ?? t.options.find((o) => o !== "focus") ?? "default" : ((n = t.options) == null ? void 0 : n.find((o) => is.has(o))) ?? (t.nullable ? null : "none");
}
function vt(t, e) {
  var n;
  for (const o of Vn(e)) {
    const r = le(t, o);
    if ((n = o.options) != null && n.includes("focus")) {
      if (r === "focus") return o;
      continue;
    }
    if (r === !0 || typeof r == "string" && !is.has(r)) return o;
  }
}
function J(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function qt(t) {
  return Array.isArray(t.children) ? t.children : [];
}
function le(t, e) {
  const n = J(t.props) ? t.props : {};
  return e.name in n ? n[e.name] : Ze(e);
}
function as(t, e, n) {
  if (e === 0) return !0;
  const o = qt(t);
  return o.length >= 2 && o.every(
    (r) => {
      var s;
      return J(r) && typeof r.type == "string" && ((s = n.components[r.type]) == null ? void 0 : s.acceptsChildren) === !0;
    }
  );
}
function il(t, e, n) {
  const o = J(t) ? t : {}, r = tl[n], s = [], i = [], a = [], l = [], c = (m, g, b) => ({ ruleId: m, message: b, path: g }), d = [], u = /* @__PURE__ */ new Set();
  for (const [m, g] of [
    ["layout width", E.base.width],
    ["layout height", E.base.height],
    ["shown width", r.width],
    ["shown height", r.height]
  ])
    Be(g) || s.push(c("frame.layout", [], `The frame ${m} (${g}px) is off the ${E.grid}pt grid.`));
  const y = ze(e), p = (m, g, b, S, R) => {
    const _ = typeof m.type == "string" ? e.components[m.type] : void 0;
    if (m.anchor !== void 0 && m.anchor !== !1 && (m.anchor !== !0 ? l.push(c("layout.anchor-structure", [...b, "anchor"], `${g}: "anchor" must be true or omitted.`)) : S !== 1 && l.push(
      c(
        "layout.anchor-structure",
        [...b, "anchor"],
        `${g}${_ ? ` <${_.id}>` : ""}: only a direct child of the root can be anchored — the frame places it on the focused side.`
      )
    )), !_) return;
    u.add(_.id);
    const W = vt(m, _);
    W && d.push({ path: g, component: _, prop: W, value: le(m, W) });
    for (const L of Object.values(_.props)) {
      if (L.tokenGroup !== "spacing") continue;
      const N = le(m, L), H = ue(e, N);
      H !== null && !Be(H) && a.push(
        c(
          "grid.8pt",
          [...b, "props", L.name],
          `${g} <${_.id}>: ${L.name} ${JSON.stringify(N)} is ${H}px — off the ${E.grid}pt grid; use ${_t()}.`
        )
      );
    }
    const z = _.acceptsChildren ? Oe(_, "gutter") : void 0;
    if (z && !R && as(m, S, e)) {
      const L = le(m, z), N = ue(e, L);
      if (N !== null && Be(N) && N !== E.gutter) {
        const H = Ee(e, Ie(e, z), E.gutter);
        a.push(
          c(
            "frame.layout",
            [...b, "props", z.name],
            `${g} <${_.id}>: ${z.name} ${JSON.stringify(L)} is ${N}px — ${S === 0 ? "the root's top-level modules" : "stacked modules and columns"} sit exactly ${E.gutter}px apart${H ? `; use ${JSON.stringify(H)}` : ""}.`
          )
        );
      }
    }
    _.acceptsChildren && qt(m).forEach((L, N) => {
      J(L) && p(L, `${g} › ${_.id}[${N}]`, [...b, "children", N], S + 1, R || _.id !== y);
    });
  };
  if (J(o.root)) {
    const m = o.root, g = typeof m.type == "string" ? e.components[m.type] : void 0;
    if (g) {
      const S = Oe(g, "margin");
      if (S) {
        const _ = le(m, S), W = ue(e, _);
        if (W !== null && W !== 0) {
          const z = Ee(e, Ie(e, S), 0);
          i.push(
            c(
              "frame.layout",
              ["root", "props", S.name],
              `root <${g.id}>: ${S.name} ${JSON.stringify(_)} adds ${W}px inside the frame's ${E.margin}px safe-area margin — the margin must be exactly ${E.margin}px, so ${z ? `set ${S.name} to ${JSON.stringify(z)}` : `remove the root's ${S.name}`}.`
            )
          );
        }
      }
      const R = St(g);
      if (R) {
        const _ = le(m, R);
        _ !== "stretch" && l.push(
          c(
            "layout.root-align",
            ["root", "props", R.name],
            `root <${g.id}>: ${R.name} ${JSON.stringify(_)} — the stack that holds the components always stretches (${R.name} "stretch"); a module that belongs on one side positions itself inside it (its own ${R.name}/justify, or a row set to justify "end").`
          )
        );
      }
      for (const _ of Fn(g))
        _ === R || le(m, _) !== "center" || l.push(
          c(
            "layout.no-static-center",
            ["root", "props", _.name],
            `root <${g.id}>: ${_.name} "center" statically centers the master layout — TV layouts follow the focus instead; use ${JSON.stringify(ss(_))}.`
          )
        );
    }
    p(m, "root", ["root"], 0, !1);
    const b = qt(m).filter((S) => J(S) && S.anchor === !0);
    if (b.length > 1 && l.push(
      c("layout.anchor", ["root"], `root: ${b.length} children are anchored — anchor at most one element group per frame.`)
    ), d.length > 1) {
      const S = d.map((_) => `${_.path} <${_.component.id}>: ${_.prop.name} ${JSON.stringify(_.value)}`).join("; "), R = d.slice(1).map((_) => `${_.prop.name} ${JSON.stringify(Tt(_.prop))}`).join(" / ");
      l.push(
        c(
          "focus.single",
          ["root"],
          `${d.length} elements are focused (${S}) — a TV screen has exactly one: the one the viewer is on. Keep the one the screen is about and rest the others (${R}).`
        )
      );
    }
  }
  const f = (m, g, b) => ({ id: m, label: g, issues: b }), h = `${E.base.width}×${E.base.height}`;
  return [
    f(
      "frame",
      r.scale === 1 ? `Layout ${h}` : `Layout ${h}, shown at ${r.label} (× ${r.scale})`,
      s
    ),
    f("margins", `${E.margin}px safe-area margins`, i),
    f("grid", `${E.grid}pt grid · ${E.gutter}px gutters`, a),
    f("focus", "Focus — no static centering, one focused element, one anchored group", l),
    f("layers", "Layer rule (Camadas) — layer model, navigation level, content side, where focus starts", [
      ...qa(o, e),
      ...ll(e, bn(o), d, u),
      ...al(e, bn(o), J(o.root) ? o.root : void 0)
    ])
  ];
}
function ls(t) {
  return Object.values(t.props).find(
    (e) => {
      var n;
      return /^justify(Content)?$/i.test(e.name) && ((n = e.options) == null ? void 0 : n.includes("end"));
    }
  );
}
function qn(t) {
  var o;
  const e = t.props.direction, n = (o = e == null ? void 0 : e.options) == null ? void 0 : o.find((r) => r === "vertical" || r === "column");
  return e && n ? { prop: e, column: n } : void 0;
}
function al(t, e, n) {
  const o = U(t), r = $e(o, e), s = r ? bt(o, r.level) : void 0;
  if (!(s != null && s.rootEnd || s != null && s.rootColumn) || !n || typeof n.type != "string") return [];
  const i = t.components[n.type];
  if (!i) return [];
  const a = qn(i);
  if (!a) return [];
  const l = [], c = le(n, a.prop), d = s.maxModules === 1;
  if (c !== a.column && l.push({
    ruleId: "level.root-direction",
    path: ["root", "props", a.prop.name],
    message: `Level ${s.level} (${s.name}): the outermost <${i.id}> is a column — direction ${JSON.stringify(c)}, use ${JSON.stringify(a.column)}` + (d ? '; put the module on its side with a row inside it (justify "start" or "end").' : ".")
  }), s.rootEnd) {
    const u = ls(i), y = u ? le(n, u) : void 0, p = r != null && r.allowsRootStart ? "start" : "end";
    u && y !== p && l.push({
      ruleId: "level.root-direction",
      path: ["root", "props", u.name],
      message: `Level ${s.level} (${s.name}): the stack sits at the ${p} of the frame — root <${i.id}> ${u.name} ${JSON.stringify(y)}, use "${p}".`
    });
  }
  return l;
}
function bn(t) {
  const e = J(t.root) ? t.root : void 0;
  return t.screen ?? (e == null ? void 0 : e.screen);
}
function ll(t, e, n, o) {
  const r = U(t), s = $e(r, e), i = s ? bt(r, s.level) : void 0, a = i == null ? void 0 : i.initialFocus;
  if (!i || !a) return [];
  const l = a.on.filter((p) => t.components[p]);
  if (l.length === 0) return [];
  const c = `Level ${i.level} (${i.name})`, d = (p) => [{ ruleId: "level.initial-focus", path: ["root"], message: p }], u = (p) => l.includes(p.component.id) && (a.value === void 0 || p.value === a.value), y = n.filter((p) => !u(p));
  return y.length > 0 ? d(`${c}: focus is on ${y.map((p) => `${p.path} <${p.component.id}>`).join(", ")} — ${a.hint}`) : n.length === 0 && l.some((p) => o.has(p)) ? d(`${c}: nothing is focused — ${a.hint}`) : a.required && !l.some((p) => o.has(p)) ? d(`${c}: the screen has no ${l.map((p) => `<${p}>`).join(" or ")} — add one and focus it. ${a.hint}`) : [];
}
function cl(t, e, n = "faithful") {
  var i;
  if (!J(t)) return [];
  const o = U(e), r = [
    { root: t.root, screen: bn(t), where: "root" },
    ...(Array.isArray(t.screens) ? t.screens : []).filter(J).map((a, l) => ({
      root: a.root,
      screen: a.screen,
      where: `screens[${l}]`
    }))
  ], s = [];
  for (const { root: a, screen: l, where: c } of r) {
    const d = $e(o, l), u = d ? bt(o, d.level) : void 0, y = ((i = u == null ? void 0 : u.initialFocus) == null ? void 0 : i.on.filter((f) => e.components[f])) ?? [];
    if (!u || y.length === 0 || !J(a) || n === "exploratory" && os(e, a, l, "level.initial-focus")) continue;
    const p = (f) => {
      const h = typeof f.type == "string" ? e.components[f.type] : void 0, m = h && !y.includes(h.id) ? vt(f, h) : void 0;
      if (m) {
        const g = Tt(m);
        f.props = { ...J(f.props) ? f.props : {}, [m.name]: g }, s.push(`${c}: <${h.id}> ${m.name} → ${JSON.stringify(g)} (level ${u.level} focuses ${y.join("/")})`);
      }
      qt(f).filter(J).forEach(p);
    };
    p(a);
  }
  return s;
}
function dl(t, e, n = "faithful") {
  if (!J(t)) return [];
  const o = [
    { root: t.root, screen: t.screen, where: "root" },
    ...(Array.isArray(t.screens) ? t.screens : []).filter(J).map((s, i) => ({ root: s.root, screen: s.screen, where: `screens[${i}]` }))
  ], r = [];
  for (const { root: s, screen: i, where: a } of o) {
    if (!J(s) || typeof s.type != "string" || n === "exploratory" && os(e, s, i, "layout.root-align")) continue;
    const l = e.components[s.type], c = l ? St(l) : void 0, d = c ? le(s, c) : "stretch";
    c && d !== "stretch" && (s.props = { ...J(s.props) ? s.props : {}, [c.name]: "stretch" }, r.push(`${a}: root <${l.id}> ${c.name} ${JSON.stringify(d)} → "stretch"`));
  }
  return r;
}
function cs(t, e) {
  return il(t, e, el).flatMap((n) => n.issues);
}
const Ao = C(Ft), ul = C(Mr), hl = C(Br), Io = I({
  direction: C(Zr).default("vertical"),
  gap: Ao.default("sm"),
  padding: Ao.default("none"),
  align: C(zr).default("stretch"),
  justify: C(Hr).default("start"),
  surface: C(Dr).default("none"),
  radius: ul.default("none"),
  shadow: hl.default("none"),
  bordered: M().default(!1),
  grow: M().default(!1)
}).strict(), Eo = I({
  content: w().default("Text"),
  variant: C(Fr).default("body"),
  tone: C(Vr).default("default"),
  align: C(["start", "center", "end"]).default("start")
}).strict(), Oo = I({
  label: w().default("Button"),
  variant: C(Ur).default("primary"),
  size: C(qr).default("md"),
  fullWidth: M().default(!1),
  disabled: M().default(!1)
}).strict(), ds = ["default", "focus", "selected"], te = ["default", "focus"], us = [
  "default",
  "focus",
  "loading",
  "disabled"
], hs = ["live", "replay"], ps = [
  "program",
  "login",
  "schedule",
  "miscellaneous",
  "channel-bug",
  "none"
], Co = I({
  focusedItem: C(ps).default("program"),
  programTitle: w().default(""),
  programSubtitle: w().default(""),
  miscellaneousTitle: w().default(""),
  miscellaneousSubtitle: w().default(""),
  miscellaneousItems: q(
    I({ title: w(), subtitle: w().optional(), iconSrc: w().optional() }).strict()
  ).max(6).default([])
}).strict(), fs = ["start", "end"], No = I({
  heading: w().default(""),
  align: C(fs).default("start")
}).strict(), jo = I({
  title: w().default(""),
  overline: w().default(""),
  subtitle: w().default(""),
  live: M().default(!1),
  check: M().default(!1),
  interactionState: C(ds).default("default"),
  /** A sponsored card: the sponsor row's wording, e.g. "Publicidade". Empty: no row. */
  advertisingLabel: w().default("")
}).strict(), Ro = I({
  kind: C(hs).default("live"),
  interactionState: C(te).default("default"),
  mini: M().default(!1)
}).strict(), Po = I({
  label: w().default(""),
  interactionState: C(us).default("default"),
  iconLeft: M().default(!1),
  iconRight: M().default(!1)
}).strict(), Lo = I({
  label: w().default("Voltar"),
  interactionState: C(te).default("default")
}).strict(), Mo = I({
  label: w().default("Fechar"),
  interactionState: C(te).default("default")
}).strict(), ms = 2 * parseFloat(Ln[_e.inset]), wn = 40;
function ys() {
  return ve().min(0).max(wn).refine(Be, { message: `must be on the 8pt scale: ${_t()}` }).optional();
}
const gs = Math.max(...Object.values(_e.rowsAtMax)), Bo = I({
  interactionState: C(te).default("default"),
  height: ve().min(ms).max(_e.maxHeight).multipleOf(ae.grid).optional(),
  gap: ys(),
  /** Rows per page: the viewer clicks the card for the next rows. Omitted: every row at once. */
  rowsPerPage: ve().min(1).max(gs).multipleOf(1).optional()
}).strict(), Do = I({
  overline: w().default(""),
  /** Empty: not drawn — a header may be only a match, a partner or an ad tag. */
  title: w().default(""),
  subtitle: w().default(""),
  /** A match: the two sides' short names, facing each other. Drawn only when both are set. */
  homeTeam: w().default(""),
  awayTeam: w().default(""),
  /** Column headings beside the subtitle, over a table's team columns. Empty ones are not drawn. */
  stat1: w().default(""),
  stat2: w().default(""),
  stat3: w().default(""),
  /** Who presents the card, above the title; `partnerVerified` adds the verified tick. */
  partnerName: w().default(""),
  partnerVerified: M().default(!1),
  /** An advertising tag under the header, over a rule. */
  adLabel: w().default("")
}).strict(), Fo = I({
  quote: w().default(""),
  gap: ys()
}).strict(), Vo = I({
  caption: w().default("")
}).strict(), pl = ["ContentCardHeader", "ContentCardBody", "ContentCardFooter"], vs = ["team", "athlete", "scout"], qo = I({
  cellType: C(vs).default("team"),
  /** Team short name, athlete name, or the stat a scout row compares. */
  label: w().default("SAO"),
  /** Standing position on a team row, shirt number on an athlete row. */
  lead: w().default(""),
  /** Team row columns, left to right. Empty ones are not drawn. */
  stat1: w().default(""),
  stat2: w().default(""),
  stat3: w().default(""),
  /** Scout row: the two sides' values. */
  leftValue: w().default(""),
  rightValue: w().default(""),
  /** Athlete row marks. */
  yellowCard: M().default(!1),
  redCard: M().default(!1),
  goals: ve().int().min(0).max(9).default(0),
  substitute: w().default(""),
  /** Team row: marks the viewer's own team. */
  favorite: M().default(!1),
  /** The rule under the row — a table draws it under a heading, not every row. */
  divider: M().default(!1)
}).strict(), bs = ["message", "rounded"], Uo = I({
  kind: C(bs).default("message"),
  title: w().default(""),
  interactionState: C(te).default("default")
}).strict(), ws = ["interface", "transmission"], Zo = I({
  bugStyle: C(ws).default("interface"),
  label: w().default("Conteúdo interativo"),
  interactionState: C(te).default("default")
}).strict(), Un = {
  Stack: {
    type: "Stack",
    label: "Stack",
    category: "layout",
    summary: "The only layout primitive. A flexbox row or column with token-based gap and padding. Nest Stacks to build any layout — there is no absolute positioning.",
    acceptsChildren: !0,
    schema: Io,
    defaultProps: Io.parse({}),
    controls: {
      direction: { kind: "select", label: "Direction", options: Zr },
      gap: { kind: "select", label: "Gap", options: Ft },
      padding: { kind: "select", label: "Padding", options: Ft },
      align: { kind: "select", label: "Align", options: zr },
      justify: { kind: "select", label: "Justify", options: Hr },
      surface: { kind: "select", label: "Surface", options: Dr },
      radius: { kind: "select", label: "Radius", options: Mr },
      shadow: { kind: "select", label: "Shadow", options: Br },
      bordered: { kind: "boolean", label: "Border" },
      grow: { kind: "boolean", label: "Fill available space" }
    }
  },
  Text: {
    type: "Text",
    label: "Text",
    category: "content",
    summary: "A single run of text. Pick a variant for size/weight; the element (h1–h3/p/span) follows.",
    acceptsChildren: !1,
    schema: Eo,
    defaultProps: Eo.parse({}),
    controls: {
      content: { kind: "textarea", label: "Content" },
      variant: { kind: "select", label: "Variant", options: Fr },
      tone: { kind: "select", label: "Tone", options: Vr },
      align: { kind: "select", label: "Align", options: ["start", "center", "end"] }
    }
  },
  Button: {
    type: "Button",
    label: "Button",
    category: "form",
    summary: "A call-to-action button. Text-only label, no children.",
    acceptsChildren: !1,
    schema: Oo,
    defaultProps: Oo.parse({}),
    controls: {
      label: { kind: "text", label: "Label" },
      variant: { kind: "select", label: "Variant", options: Ur },
      size: { kind: "select", label: "Size", options: qr },
      fullWidth: { kind: "boolean", label: "Full width" },
      disabled: { kind: "boolean", label: "Disabled" }
    }
  },
  // --- DTV UI Kit ---------------------------------------------------------
  MainMenu: {
    type: "MainMenu",
    label: "Main Menu",
    category: "layout",
    summary: "The home menu pinned along the bottom edge: login, schedule and miscellaneous on the left, the live program and the channel bug on the right. At rest the miscellaneous button can cycle through several items of its own (miscellaneousItems — the weather, a match, a premiere), one at a time, instead of showing one still line. One screen has at most one, and it is never anchored: it holds the focus in the content.",
    acceptsChildren: !1,
    schema: Co,
    defaultProps: Co.parse({}),
    controls: {
      focusedItem: { kind: "select", label: "Focused item", options: ps },
      programTitle: { kind: "text", label: "Program title" },
      programSubtitle: { kind: "text", label: "Program subtitle" },
      miscellaneousTitle: { kind: "text", label: "Miscellaneous title" },
      miscellaneousSubtitle: { kind: "text", label: "Miscellaneous subtitle" },
      miscellaneousItems: { kind: "list", label: "Miscellaneous items" }
    }
  },
  InteractivityMenu: {
    type: "InteractivityMenu",
    label: "Interactivity Menu",
    category: "layout",
    summary: "A horizontal rail of interactivity cards. On the home screen it carries no heading and sits on the right; once the viewer enters it the whole row expands, the entered card taking the focus and the rest going selected.",
    acceptsChildren: !0,
    schema: No,
    defaultProps: No.parse({}),
    controls: {
      heading: { kind: "text", label: "Heading" },
      align: { kind: "select", label: "Align", options: fs }
    }
  },
  InteractivityButton: {
    type: "InteractivityButton",
    label: "Interactivity Button",
    category: "content",
    summary: 'One card in a rail. As an interactivity it is the way into a nível 3 screen and carries its title alone — no overline, no subtitle, no live badge. Overline, subtitle and the live badge belong to the schedule section, where a card stands for a programme. A sponsored card sets advertisingLabel (e.g. "Publicidade"), which adds the sponsor row under its text.',
    acceptsChildren: !1,
    schema: jo,
    defaultProps: jo.parse({}),
    controls: {
      title: { kind: "text", label: "Title" },
      overline: { kind: "text", label: "Overline" },
      subtitle: { kind: "text", label: "Subtitle" },
      live: { kind: "boolean", label: "Live badge" },
      check: { kind: "boolean", label: "Check mark" },
      interactionState: { kind: "select", label: "State", options: ds },
      advertisingLabel: { kind: "text", label: "Sponsor row" }
    }
  },
  LabelVideo: {
    type: "LabelVideo",
    label: "Label Video",
    category: "content",
    summary: "The AO VIVO / REPLAY chip that says what the video behind the screen is.",
    acceptsChildren: !1,
    schema: Ro,
    defaultProps: Ro.parse({}),
    controls: {
      kind: { kind: "select", label: "Kind", options: hs },
      interactionState: { kind: "select", label: "State", options: te },
      mini: { kind: "boolean", label: "Mini" }
    }
  },
  WideButton: {
    type: "WideButton",
    label: "Wide Button",
    category: "form",
    summary: 'The pill call-to-action of a screen — "Assistir", "Entrar na sala". Text with optional icons.',
    acceptsChildren: !1,
    schema: Po,
    defaultProps: Po.parse({}),
    controls: {
      label: { kind: "text", label: "Label" },
      interactionState: { kind: "select", label: "State", options: us },
      iconLeft: { kind: "boolean", label: "Icon left" },
      iconRight: { kind: "boolean", label: "Icon right" }
    }
  },
  Notification: {
    type: "Notification",
    label: "Notification",
    category: "content",
    summary: "The message that arrives in the top-right corner, over whatever is on screen: the programme logo and a line saying why it came. `rounded` withholds the text and shows the logo alone. It carries no scrim of its own — a screen showing one uses a layer model whose shades include the top-right corner.",
    acceptsChildren: !1,
    schema: Uo,
    defaultProps: Uo.parse({}),
    controls: {
      kind: { kind: "select", label: "Kind", options: bs },
      title: { kind: "textarea", label: "Title" },
      interactionState: { kind: "select", label: "State", options: te }
    }
  },
  AlertBug: {
    type: "AlertBug",
    label: "Alert Bug",
    category: "content",
    summary: "The bug in the bottom-right corner that says an interactivity is waiting. It is the whole of a nível 0 screen, over the clean broadcast. `interface` is the kit’s own bug and can hold the focus; `transmission` is the broadcaster’s larger mark and never does.",
    acceptsChildren: !1,
    schema: Zo,
    defaultProps: Zo.parse({}),
    controls: {
      bugStyle: { kind: "select", label: "Style", options: ws },
      label: { kind: "text", label: "Label" },
      interactionState: { kind: "select", label: "State", options: te }
    }
  },
  RoundedButton: {
    type: "RoundedButton",
    label: "Rounded Button",
    category: "form",
    summary: "The icon-only round control that steps back a level. To dismiss an interactivity, use Close Button.",
    acceptsChildren: !1,
    schema: Lo,
    defaultProps: Lo.parse({}),
    controls: {
      label: { kind: "text", label: "Label" },
      interactionState: { kind: "select", label: "State", options: te }
    }
  },
  CloseButton: {
    type: "CloseButton",
    label: "Close Button",
    category: "form",
    summary: "The icon-only round control that closes an interactivity, anchored in the focused corner.",
    acceptsChildren: !1,
    schema: Mo,
    defaultProps: Mo.parse({}),
    controls: {
      label: { kind: "text", label: "Label" },
      interactionState: { kind: "select", label: "State", options: te }
    }
  },
  ContentCard: {
    type: "ContentCard",
    label: "Content Card",
    category: "content",
    summary: `The tall 288-wide card for a vertical highlight (statistics, a line-up). Holds up to three zones — Header, Body, Footer — in that order; leave out any you do not need. At its tallest (${_e.maxHeight}) its body holds ${_e.rowsAtMax.team} team rows, ${_e.rowsAtMax.athlete} athlete rows or ${_e.rowsAtMax.scout} scout rows under a header and footer: for a longer table set rowsPerPage, and the viewer clicks the card for the next rows.`,
    acceptsChildren: !0,
    slots: pl,
    schema: Bo,
    defaultProps: Bo.parse({}),
    controls: {
      interactionState: { kind: "select", label: "State", options: te },
      height: {
        kind: "number",
        label: "Height",
        min: ms,
        max: _e.maxHeight,
        step: ae.grid
      },
      gap: { kind: "number", label: "Zone gap", min: 0, max: wn, grid: !0 },
      rowsPerPage: { kind: "number", label: "Rows per page", min: 1, max: gs, step: 1 }
    }
  },
  ContentCardHeader: {
    type: "ContentCardHeader",
    label: "Content Card Header",
    category: "content",
    summary: `A Content Card's top zone; everything is optional and collapses when empty. Plain: overline, title, subtitle. A match: homeTeam and awayTeam face each other above the title (set title to "" to show the match alone). A table heading: subtitle with stat1–stat3 as the column headings over the Table Cell team rows' stat1–stat3. A partner: partnerName above the title, partnerVerified adds the verified tick. An ad: adLabel, a tag under the header over a rule. Only goes inside a Content Card.`,
    acceptsChildren: !1,
    parents: ["ContentCard"],
    schema: Do,
    defaultProps: Do.parse({}),
    controls: {
      overline: { kind: "text", label: "Overline" },
      title: { kind: "text", label: "Title" },
      subtitle: { kind: "text", label: "Subtitle" },
      homeTeam: { kind: "text", label: "Home team" },
      awayTeam: { kind: "text", label: "Away team" },
      stat1: { kind: "text", label: "Column 1 heading" },
      stat2: { kind: "text", label: "Column 2 heading" },
      stat3: { kind: "text", label: "Column 3 heading" },
      partnerName: { kind: "text", label: "Partner" },
      partnerVerified: { kind: "boolean", label: "Partner verified" },
      adLabel: { kind: "text", label: "Ad tag" }
    }
  },
  ContentCardBody: {
    type: "ContentCardBody",
    label: "Content Card Body",
    category: "content",
    summary: "A Content Card's main zone; it takes the height the others leave. Holds the card's content, and an optional quote under it. Only goes inside a Content Card.",
    acceptsChildren: !0,
    parents: ["ContentCard"],
    schema: Fo,
    defaultProps: Fo.parse({}),
    controls: {
      quote: { kind: "textarea", label: "Quote" },
      gap: { kind: "number", label: "Row gap", min: 0, max: wn, grid: !0 }
    }
  },
  ContentCardFooter: {
    type: "ContentCardFooter",
    label: "Content Card Footer",
    category: "content",
    summary: "A Content Card's bottom zone, pinned to the bottom edge: a caption, and any controls it holds. Only goes inside a Content Card.",
    acceptsChildren: !0,
    parents: ["ContentCard"],
    schema: Vo,
    defaultProps: Vo.parse({}),
    controls: {
      caption: { kind: "text", label: "Caption" }
    }
  },
  TableCell: {
    type: "TableCell",
    label: "Table Cell",
    category: "content",
    summary: "One row of a table inside a Content Card's body: a team and its columns, an athlete and their marks, or a scout row naming a stat between the two sides' values. Stack them to build the table. Only goes inside a Content Card Body.",
    acceptsChildren: !1,
    parents: ["ContentCardBody"],
    schema: qo,
    defaultProps: qo.parse({}),
    controls: {
      cellType: { kind: "select", label: "Row", options: vs },
      label: { kind: "text", label: "Name" },
      lead: { kind: "text", label: "Position / number" },
      stat1: { kind: "text", label: "Stat 1" },
      stat2: { kind: "text", label: "Stat 2" },
      stat3: { kind: "text", label: "Stat 3" },
      leftValue: { kind: "text", label: "Left value" },
      rightValue: { kind: "text", label: "Right value" },
      yellowCard: { kind: "boolean", label: "Yellow card" },
      redCard: { kind: "boolean", label: "Red card" },
      goals: { kind: "number", label: "Goals", min: 0, max: 9, step: 1 },
      substitute: { kind: "text", label: "Substitute" },
      favorite: { kind: "boolean", label: "Favourite" },
      divider: { kind: "boolean", label: "Divider" }
    }
  }
}, Zn = Object.keys(Un);
function fl(t) {
  return Object.prototype.hasOwnProperty.call(Un, t);
}
function ml(t) {
  return fl(t) ? Un[t] : null;
}
const yl = {
  id: "alert",
  name: "Alerta",
  when: "The clean broadcast with an interactivity alert bug in the bottom-right corner — no menu, no rail, nothing else on screen.",
  blueprint: {
    version: 1,
    screen: { model: "alert", level: 0 },
    root: {
      type: "Stack",
      props: {
        direction: "vertical",
        justify: "end",
        align: "stretch",
        gap: "sm",
        padding: "none",
        grow: !0
      },
      children: [
        {
          type: "Stack",
          props: { direction: "horizontal", justify: "end", align: "end", gap: "sm" },
          children: [
            {
              type: "AlertBug",
              props: { bugStyle: "interface", interactionState: "default", label: "Conteúdo interativo" }
            }
          ]
        }
      ]
    }
  }
}, zn = {
  id: "home",
  name: "Home",
  when: "The home screen after login: the main menu along the bottom and the interactivity rail resting above it, focus on the programme button.",
  blueprint: {
    version: 1,
    screen: { model: "home", level: 1 },
    root: {
      type: "Stack",
      props: { direction: "vertical", justify: "end", gap: "sm", padding: "none", grow: !0 },
      children: [
        {
          type: "Stack",
          props: { direction: "vertical", justify: "end", gap: "2xl" },
          children: [
            {
              type: "InteractivityMenu",
              props: { align: "end" },
              children: [
                { type: "InteractivityButton", props: { title: "Opções de áudio" } },
                { type: "InteractivityButton", props: { title: "Lances da partida" } },
                { type: "InteractivityButton", props: { title: "Vote no Craque do Jogo" } },
                { type: "InteractivityButton", props: { title: "Estatísticas" } }
              ]
            },
            {
              type: "MainMenu",
              props: {
                focusedItem: "program",
                miscellaneousTitle: "Previsão do tempo",
                miscellaneousSubtitle: "São Paulo, SP",
                programTitle: "Copa do Mundo: Equador x Argentina",
                programSubtitle: "A seguir Central da Copa"
              }
            }
          ]
        }
      ]
    }
  }
}, $s = {
  id: "home-notification",
  name: "Home + Notificação",
  when: "The home screen while a notification shows in the top-right corner — same menu and rail, one extra shade.",
  blueprint: {
    version: 1,
    screen: { model: "home-notification", level: 1 },
    root: {
      type: "Stack",
      props: { direction: "vertical", justify: "between", gap: "sm", padding: "none", grow: !0 },
      children: [
        {
          type: "Stack",
          props: { direction: "horizontal", justify: "end", gap: "sm" },
          children: [
            {
              type: "Notification",
              props: {
                kind: "message",
                title: `Paredão formado!
Vote agora para eliminar`,
                interactionState: "default"
              }
            }
          ]
        },
        {
          type: "Stack",
          props: { direction: "vertical", justify: "end", gap: "2xl" },
          children: [
            {
              type: "InteractivityMenu",
              props: { align: "end" },
              children: [
                { type: "InteractivityButton", props: { title: "Opções de áudio" } },
                { type: "InteractivityButton", props: { title: "Lances da partida" } },
                { type: "InteractivityButton", props: { title: "Vote no Craque do Jogo" } },
                { type: "InteractivityButton", props: { title: "Estatísticas" } }
              ]
            },
            {
              type: "MainMenu",
              props: {
                focusedItem: "program",
                miscellaneousTitle: "Previsão do tempo",
                miscellaneousSubtitle: "São Paulo, SP",
                programTitle: "Copa do Mundo: Equador x Argentina",
                programSubtitle: "A seguir Central da Copa"
              }
            }
          ]
        }
      ]
    }
  }
}, ks = {
  id: "home-schedule",
  name: "Home · Programação",
  when: "Home with the schedule rail on the left: focus on the Schedule button, one card per programme with its time, whether it is live, and its name.",
  blueprint: {
    version: 1,
    screen: { model: "home-buttons-left", level: 1 },
    root: {
      type: "Stack",
      props: { direction: "vertical", justify: "end", gap: "sm", padding: "none", grow: !0 },
      children: [
        {
          type: "Stack",
          props: { direction: "vertical", justify: "end", gap: "2xl" },
          children: [
            {
              type: "InteractivityMenu",
              props: { align: "start" },
              children: [
                { type: "InteractivityButton", props: { overline: "13:00", live: !0, title: "Jornal da Tarde" } },
                { type: "InteractivityButton", props: { overline: "14:30", title: "Cinema em Casa" } },
                { type: "InteractivityButton", props: { overline: "16:00", title: "Novela das Seis" } }
              ]
            },
            {
              type: "MainMenu",
              props: {
                focusedItem: "schedule",
                miscellaneousTitle: "Previsão do tempo",
                miscellaneousSubtitle: "São Paulo, SP",
                programTitle: "Copa do Mundo: Equador x Argentina",
                programSubtitle: "A seguir Central da Copa"
              }
            }
          ]
        }
      ]
    }
  }
}, on = ks.blueprint.root, gl = $s.blueprint.root.children[0], vl = {
  id: "home-schedule-notification",
  name: "Home · Programação + Notificação",
  when: "Home with a left rail (schedule, miscellaneous or login) while a notification shows in the top-right corner — focus stays on the left menu button.",
  blueprint: {
    version: 1,
    screen: { model: "home-buttons-left-notification", level: 1 },
    root: {
      ...on,
      props: { ...on.props, justify: "between" },
      children: [gl, ...on.children]
    }
  }
};
function bl(t, e, n) {
  return {
    type: "TableCell",
    props: { cellType: "scout", label: t, leftValue: e, rightValue: n, divider: !0 }
  };
}
function zo(t, e, n) {
  return {
    type: "TableCell",
    props: {
      cellType: "team",
      label: t,
      lead: e,
      stat1: n[0],
      stat2: n[1],
      stat3: n[2]
    }
  };
}
function wl() {
  return {
    type: "ContentCard",
    props: { interactionState: "default", height: 272 },
    children: [
      {
        type: "ContentCardHeader",
        props: { title: "Estatísticas", subtitle: "1º tempo" }
      },
      {
        type: "ContentCardBody",
        children: [
          bl("Posse de bola", "62%", "38%"),
          zo("EQU", "1", ["11", "5", "2"]),
          zo("ARG", "2", ["7", "3", "1"])
        ]
      },
      { type: "ContentCardFooter", props: { caption: "Atualizado há 1 min" } }
    ]
  };
}
function xs(t) {
  const e = t === "right";
  return {
    id: `interactivity-cards-${t}`,
    name: `Interatividades · Cards ${e ? "Direita" : "Esquerda"}`,
    when: `A single interactivity holding the screen on the ${t}, with its anchored control in that corner — nível 3, nothing else on screen.`,
    blueprint: {
      version: 1,
      screen: { model: `interactivity-cards-${t}`, level: 3 },
      root: {
        type: "Stack",
        props: {
          direction: "vertical",
          justify: "end",
          align: "stretch",
          gap: "sm",
          padding: "none",
          grow: !0
        },
        children: [
          {
            type: "Stack",
            props: { direction: "horizontal", justify: e ? "end" : "start", align: "end", gap: "sm" },
            children: [wl()]
          },
          { type: "RoundedButton", props: { label: "Voltar", interactionState: "focus" }, anchor: !0 }
        ]
      }
    }
  };
}
const _s = xs("right"), $l = xs("left"), Ss = {
  id: "interactivity-buttons-right",
  name: "Interatividades · Botões Direita",
  when: "The interactivity rail after the viewer enters it: no menu, the whole row expanded, one card focused and the rest selected.",
  blueprint: {
    version: 1,
    screen: { model: "interactivity-buttons-right", level: 2 },
    root: {
      type: "Stack",
      props: {
        direction: "vertical",
        justify: "end",
        align: "stretch",
        gap: "sm",
        padding: "none",
        grow: !0
      },
      children: [
        {
          type: "InteractivityMenu",
          props: { align: "end" },
          children: [
            { type: "InteractivityButton", props: { title: "Opções de áudio", interactionState: "selected" } },
            { type: "InteractivityButton", props: { title: "Lances da partida", interactionState: "selected" } },
            { type: "InteractivityButton", props: { title: "Vote no Craque do Jogo", interactionState: "focus" } },
            { type: "InteractivityButton", props: { title: "Estatísticas", interactionState: "selected" } }
          ]
        }
      ]
    }
  }
};
function Nt(t, e) {
  if (t.type === e) return t;
  for (const n of t.children ?? []) {
    const o = kl(n, e);
    if (o) return o;
  }
  throw new Error(`prototypeFlow: no <${e}> in the template`);
}
function kl(t, e) {
  try {
    return Nt(t, e);
  } catch {
    return null;
  }
}
function xl() {
  const t = structuredClone(zn.blueprint), e = structuredClone(Ss.blueprint), n = structuredClone(_s.blueprint);
  return Nt(t.root, "InteractivityButton").goTo = "rail", Nt(e.root, "InteractivityButton").goTo = "stats", Nt(n.root, "RoundedButton").goTo = "rail", {
    version: 1,
    id: "home",
    name: "Home",
    screen: t.screen,
    root: t.root,
    screens: [
      { id: "rail", name: "Trilho", screen: e.screen, root: e.root },
      { id: "stats", name: "Estatísticas", screen: n.screen, root: n.root }
    ]
  };
}
const _l = {
  id: "prototype-flow",
  name: "Fluxo clicável · Home → Trilho → Estatísticas",
  when: 'A clickable prototype across the levels: Home, the rail the viewer enters, one interactivity whose back button returns to the rail. Use it for any flow or "what happens when I click" request; drop the screens the request does not need.',
  blueprint: xl()
};
function Sl(t) {
  const e = /^[ \t]*template[ \t]*:[ \t]*([A-Za-z0-9-]+)/im.exec(t);
  return e ? e[1].toLowerCase() : void 0;
}
function Tl(t) {
  const e = /^[ \t]*screen[ \t]*:.*?model[ \t]*["']?([A-Za-z0-9-]+)/im.exec(t);
  return e ? e[1].toLowerCase() : void 0;
}
function Al(t) {
  const e = t.screen;
  if (typeof e != "object" || e === null) return;
  const n = e.model;
  return typeof n == "string" ? n : void 0;
}
function Ts(t, e) {
  if (e.length === 0) return { reason: "unavailable" };
  const n = Sl(t);
  if (n === "none") return { reason: "none" };
  if (n) {
    const r = e.find((s) => s.id === n);
    if (r) return { template: r, reason: "named" };
  }
  const o = Tl(t);
  if (o) {
    const r = e.find((s) => Al(s.blueprint) === o);
    if (r) return { template: r, reason: "model" };
  }
  return { reason: "none" };
}
const As = [
  zn,
  $s,
  ks,
  vl,
  Ss,
  _s,
  $l,
  yl,
  _l
];
As.map((t) => t.id);
const Is = "screenflow";
function Il() {
  return {
    colors: {
      page: Z.gray[100],
      surface: Z.white,
      subtle: Z.gray[50],
      line: Z.gray[200],
      "line-strong": Z.gray[300],
      ink: Z.gray[900],
      "ink-muted": Z.gray[500],
      "ink-inverse": Z.white,
      brand: Z.blue[500],
      "brand-hover": Z.blue[600],
      "brand-subtle": Z.blue[100],
      "brand-strong": Z.blue[700],
      danger: Z.red[500],
      "danger-hover": Z.red[600],
      "danger-subtle": Z.red[100],
      success: Z.green[500],
      "success-subtle": Z.green[100]
    },
    spacing: { ...Ln },
    typography: Object.fromEntries([
      ...Object.entries(Pa).map(([t, [e]]) => [`size-${t}`, e]),
      ...Object.entries(La).map(([t, e]) => [`weight-${t}`, e])
    ]),
    radius: { ...Pr },
    shadow: { ...Lr }
  };
}
function El(t) {
  const e = (n, o) => Object.fromEntries(Object.keys(n ?? {}).map((r) => [r, o]));
  return {
    rule: Ge,
    tiers: {
      colors: e(t.colors, "semantic"),
      shadow: e(t.shadow, "semantic"),
      spacing: e(t.spacing, "layout"),
      radius: e(t.radius, "layout"),
      typography: e(t.typography, "layout")
    }
  };
}
function Es(t) {
  return t.shape ?? {};
}
function Ol(t) {
  if (!t) return { name: "string" };
  switch (t.kind) {
    case "boolean":
      return { name: "boolean" };
    case "select":
      return { name: "enum" };
    case "number":
      return { name: "number" };
    case "list":
      return { name: "array" };
    default:
      return { name: "string" };
  }
}
function Ho(t) {
  if (t)
    return t.kind;
}
function Cl(t) {
  var s;
  const e = t instanceof Dt ? t.removeDefault() : t, n = e instanceof se ? e : void 0, o = Object.fromEntries(
    Object.entries(n ? Es(n.element) : {}).map(([i, a]) => [
      i,
      { name: i, type: { name: "string" }, required: !a.isOptional(), control: "text" }
    ])
  ), r = (s = n == null ? void 0 : n._def.maxLength) == null ? void 0 : s.value;
  return r !== void 0 ? { fields: o, max: r } : { fields: o };
}
function Nl(t) {
  const e = ml(t), n = Es(e.schema), o = {};
  for (const r of Object.keys(n)) {
    const s = e.controls[r], i = (s == null ? void 0 : s.kind) === "select" ? [...s.options] : void 0, a = (s == null ? void 0 : s.kind) === "select" && s.options === Ft;
    o[r] = {
      name: r,
      type: Ol(s),
      required: !1,
      // every catalog prop has a schema default
      defaultValue: e.defaultProps[r],
      ...i ? { options: i } : {},
      ...a ? { tokenGroup: "spacing" } : {},
      ...Ho(s) ? { control: Ho(s) } : {},
      ...(s == null ? void 0 : s.kind) === "number" && s.min !== void 0 ? { min: s.min } : {},
      ...(s == null ? void 0 : s.kind) === "number" && s.max !== void 0 ? { max: s.max } : {},
      ...(s == null ? void 0 : s.kind) === "number" && s.step !== void 0 ? { step: s.step } : {},
      ...(s == null ? void 0 : s.kind) === "number" && s.grid ? { grid: !0 } : {},
      ...(s == null ? void 0 : s.kind) === "list" ? Cl(n[r]) : {}
    };
  }
  return {
    id: e.type,
    name: e.label,
    description: e.summary,
    category: e.category,
    acceptsChildren: e.acceptsChildren,
    ...e.slots ? { slots: [...e.slots] } : {},
    ...e.parents ? { parents: [...e.parents] } : {},
    props: o
  };
}
function jl() {
  const t = {};
  for (const e of Zn) t[e] = Nl(e);
  return t;
}
function Rl() {
  const t = Il();
  return {
    id: Is,
    name: "ScreenFlow",
    version: "1.0.0",
    tokens: t,
    components: jl(),
    tokenTiers: El(t),
    // Every screen is a DTV+ TV screen, so the built-in system follows the DTV layer rule.
    screenLayers: Jr,
    templates: As,
    rules: ts
  };
}
const Ce = Rl(), Pl = {
  Button: ["botao", "botoes"],
  WideButton: ["botao largo", "botoes largos", "botao de acao", "botao assistir"],
  RoundedButton: ["botao redondo", "botoes redondos", "botao de voltar", "botao voltar"],
  CloseButton: ["botao de fechar", "botao fechar", "botao x"],
  MainMenu: ["menu principal", "menu", "botao de programa", "botao do programa"],
  InteractivityMenu: ["trilho", "trilhos", "rail"],
  InteractivityButton: [
    "interatividade",
    "interatividades",
    "card de interatividade",
    "cards de interatividade",
    "botao de interatividade",
    "botoes de interatividade"
  ],
  ContentCard: ["card de conteudo", "cards de conteudo", "cartao de conteudo"],
  ContentCardHeader: ["cabecalho do card", "cabecalho"],
  ContentCardBody: ["corpo do card"],
  ContentCardFooter: ["rodape do card", "rodape"],
  TableCell: ["tabela", "tabelas", "linha da tabela", "escalacao"],
  Notification: ["notificacao", "notificacoes", "aviso", "avisos"],
  AlertBug: ["alerta", "alertas", "bug de alerta"],
  LabelVideo: ["selo ao vivo", "selo de ao vivo", "selo replay", "etiqueta ao vivo"],
  Text: ["texto", "textos"]
}, Ll = {
  carousel: ["carrossel", "carrosseis", "carousel"],
  modal: ["modal", "modais", "popup", "pop up"],
  dropdown: ["dropdown", "menu suspenso"],
  sidebar: ["sidebar", "barra lateral"],
  tabs: ["abas", "aba", "tabs"],
  slider: ["slider", "controle deslizante"],
  tooltip: ["tooltip"],
  accordion: ["accordion", "acordeao", "sanfona"],
  toggle: ["toggle", "switch", "interruptor"],
  checkbox: ["checkbox", "caixa de selecao"],
  "text input": ["campo de texto", "input", "formulario"],
  chart: ["grafico", "graficos", "chart"],
  "progress bar": ["barra de progresso", "progress bar"],
  avatar: ["avatar"]
}, Ml = [
  /\bexplor(e|ar|a|ando|atorio|atoria)\b/,
  /(^|[.!?]\s*)e se\b/,
  /\bfora do(s)? padr(ao|oes)\b/,
  /\bquebr(e|ar|ando) o padrao\b/,
  /\bexperimental\b/,
  /\bwhat if\b/,
  // An outright request for a new component ("proponha um componente novo", "propose a component"): there is nothing
  // in the patterns to follow, so Auto asks. Prefer these over a generic "novo" so "novo card" does not trip it.
  /\bnovos? componentes?\b/,
  /\bcomponentes? novos?\b/,
  /\bprop(o|oe|onha|onhas|onho|or|orem|ondo|osta|ostas)\b[^.!?]{0,30}\bcomponentes?\b/,
  /\bnew components?\b/,
  /\bpropos(e|ing|al)\b[^.!?]{0,30}\bcomponents?\b/
], Os = (t) => t.normalize("NFD").replace(new RegExp("\\p{M}", "gu"), "").toLowerCase(), $n = (t) => Os(t).replace(/[^a-z0-9]+/g, " ").trim(), Bl = (t) => $n(t.replace(/([a-z0-9])([A-Z])/g, "$1 $2"));
function Hn(t, e) {
  const n = [], o = e.id === Is;
  for (const c of Object.values(e.components)) {
    const d = [Bl(c.id), $n(c.name), ...o && Pl[c.id] || []];
    for (const u of /* @__PURE__ */ new Set([...d, ...d.map((y) => `${y}s`)])) u && n.push({ text: u, component: c.id });
  }
  for (const [c, d] of Object.entries(Ll)) for (const u of d) n.push({ text: u, part: c });
  n.sort((c, d) => d.text.length - c.text.length || +!!c.part - +!!d.part);
  let r = ` ${$n(t)} `;
  const s = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set();
  for (const c of n) {
    const d = ` ${c.text} `;
    r.includes(d) && (r = r.split(d).join(" # "), c.component ? s.add(c.component) : c.part && i.add(c.part));
  }
  const a = Os(t), l = Ml.map((c) => {
    var d;
    return (d = a.match(c)) == null ? void 0 : d[0].replace(/^[.!?\s]+/, "").trim();
  }).filter(
    (c) => !!c
  );
  return { components: [...s], unknown: [...i], exploration: l };
}
function Dl(t, e = "root") {
  const n = [], o = (r, s, i) => {
    if (typeof r != "object" || r === null) return;
    const a = r;
    a.goTo !== void 0 && n.push({ path: s, type: String(a.type), target: a.goTo, at: i }), Array.isArray(a.children) && a.children.forEach((l, c) => {
      const d = typeof l == "object" && l !== null ? String(l.type) : "?";
      o(l, `${s} › ${d}[${c}]`, [...i, "children", c]);
    });
  };
  return o(t, e, ["root"]), n;
}
function Cs(t, e) {
  return t === void 0 || e === void 0 || e <= t + 1 ? null : `it jumps from level ${t} to level ${e} — a link opens the next level (${t + 1}) or goes back up, never skips one`;
}
function Ns(t, e, n, o) {
  var s, i, a;
  const r = U(t).links;
  return r ? (s = r.none) != null && s.includes(e) ? `<${e}> carries no link — link the element that opens the next page (an interactivity button)` : n === void 0 || o === void 0 ? null : (i = r.back) != null && i.includes(e) && o !== n - 1 ? `<${e}> is a back control: it returns exactly one level (from level ${n} to level ${n - 1}), never further — closing everything back to Home is the close button's job` : (a = r.close) != null && a.includes(e) && o !== 1 ? `<${e}> is a close control: it closes everything and returns to Home (level 1), not to level ${o} — stepping back one level is the back button's job` : null : null;
}
function Ut(t, e) {
  var n;
  if (!(typeof e != "object" || e === null))
    return (n = $e(U(t), e)) == null ? void 0 : n.level;
}
function Fl(t, e) {
  const n = [], o = /* @__PURE__ */ new Set();
  t.forEach((s, i) => {
    o.has(s.id) && n.push({ ruleId: "blueprint.dsl", screen: i, path: ["id"], message: `Two screens share the id "${s.id}" — every screen id is unique.` }), o.add(s.id);
  });
  const r = [...o].map((s) => `"${s}"`).join(", ");
  return t.forEach((s, i) => {
    const a = Ut(e, s.screen);
    for (const l of Dl(s.root)) {
      const c = `screen "${s.id}" ${l.path}`, d = [...l.at, "goTo"];
      if (typeof l.target != "string" || !o.has(l.target)) {
        n.push({
          ruleId: "blueprint.dsl",
          screen: i,
          path: d,
          message: `${c}: goTo ${JSON.stringify(l.target)} is not a screen of this document. Screens: ${r}.`
        });
        continue;
      }
      if (l.target === s.id) {
        n.push({ ruleId: "blueprint.dsl", screen: i, path: d, message: `${c}: goTo "${l.target}" links the screen to itself.` });
        continue;
      }
      const u = t.find((h) => h.id === l.target), y = Ut(e, u == null ? void 0 : u.screen), p = Cs(a, y), f = p ? null : Ns(e, l.type, a, y);
      p ? n.push({ ruleId: "flow.next-level", screen: i, path: d, message: `${c}: goTo "${l.target}" — ${p}.` }) : f && n.push({ ruleId: "flow.link-roles", screen: i, path: d, message: `${c}: goTo "${l.target}" — ${f}.` });
    }
  }), n.push(...Vl(t, e)), n;
}
function Vl(t, e) {
  var i, a;
  const n = ((a = (i = U(e).levels.find((l) => l.level === 2)) == null ? void 0 : i.initialFocus) == null ? void 0 : a.on) ?? [];
  if (n.length === 0) return [];
  const o = (l) => {
    let c = 0;
    const d = (u) => {
      if (typeof u != "object" || u === null) return;
      const y = u;
      typeof y.type == "string" && n.includes(y.type) && (c += 1), Array.isArray(y.children) && y.children.forEach(d);
    };
    return d(l), c;
  }, r = t.find((l) => Ut(e, l.screen) === 1 && o(l.root) > 0);
  if (!r) return [];
  const s = o(r.root);
  return t.flatMap(
    (l, c) => Ut(e, l.screen) === 2 && o(l.root) !== s ? [
      {
        ruleId: "flow.rail-consistency",
        screen: c,
        path: ["root"],
        message: `Screen "${l.id}": the rail shows ${o(l.root)} interactivity button(s), but the Home rail it is entered from ("${r.id}") shows ${s} — the second level is the same rail, entered; keep the same cards.`
      }
    ] : []
  );
}
const rn = 1;
function Jn(t, e) {
  const n = {};
  for (const o of Object.values(t)) n[o.name] = ql(o, e);
  return I(n).strict();
}
function ql(t, e) {
  let n;
  const o = t.tokenGroup, r = o ? Ht(e, o) : [], s = o && t.options ? t.options.filter((d) => !qe(e, o, d)) : t.options, i = s && s.length > 0 ? s : r.length > 0 ? r : null, a = t.tokenGroup === "spacing", l = i && a ? rt(e, i) : i;
  if (l)
    n = C(l);
  else
    switch (t.type.name) {
      case "boolean":
        n = M();
        break;
      case "number": {
        let d = ve().finite();
        t.min !== void 0 && (d = d.min(t.min)), t.max !== void 0 && (d = d.max(t.max)), t.step !== void 0 && (d = d.multipleOf(t.step)), n = t.grid ? d.refine(Be, { message: `must be on the 8pt scale: ${_t()}` }) : d;
        break;
      }
      case "array": {
        const d = t.fields ? Jn(t.fields, e) : w();
        let u = q(d);
        t.min !== void 0 && (u = u.min(t.min)), t.max !== void 0 && (u = u.max(t.max)), n = u;
        break;
      }
      default:
        n = w();
    }
  t.nullable && (n = n.nullable());
  let c = t.defaultValue;
  return l && o && qe(e, o, c) && (c = Pn(e, o, String(c)).find((u) => l.includes(u)) ?? l[0]), l && a && Gt(e, c) && (c = rl(e, l, c) ?? c), c !== void 0 ? n = n.default(c) : t.required || (n = n.optional()), n;
}
function js(t, e) {
  const n = Aa(t);
  for (const [o, r] of Object.entries(e.shape)) {
    if (r.safeParse(n[o]).success) continue;
    const s = r.safeParse(void 0);
    s.success && (n[o] = s.data);
  }
  return n;
}
const Jo = /* @__PURE__ */ new WeakMap();
function Rs(t, e = "faithful") {
  let n = Jo.get(t);
  n || Jo.set(t, n = /* @__PURE__ */ new Map());
  const o = n.get(e);
  if (o) return o;
  const r = e === "exploratory" ? $t(t).components : t.components, s = {};
  for (const i of Object.values(r)) s[i.id] = Jn(i.props, t);
  return e === "exploratory" && (s[Ue] = Ul()), n.set(e, s), s;
}
const kn = 12;
function Ul() {
  return I({
    description: w().trim().min(1).max(300),
    proposedApi: Q(
      w().regex(/^[A-Za-z][A-Za-z0-9]{0,39}$/, "a prop name is an identifier (letters and digits, starting with a letter)"),
      w().trim().min(1).max(80)
    ).refine((t) => Object.keys(t).length >= 1 && Object.keys(t).length <= kn, {
      message: `between 1 and ${kn} props`
    })
  }).strict();
}
const Zl = /^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla|oklch)\(.*\)|-?\d*\.?\d+(px|rem|em|%))$/i, Wo = (t) => t.map((e) => `"${e}"`).join(" or ");
function Ps(t, e, n) {
  if (typeof n != "string") return null;
  const o = t.tokens[e] ?? {};
  if (qe(t, e, n)) {
    const r = Pn(t, e, n);
    return r.length > 0 ? `is a core token. The token tier rule forbids core tokens in a screen — use the semantic token ${Wo(r)} (same value).` : `is a core token. The token tier rule forbids core tokens in a screen — use the semantic ${e} token that matches the element's role.`;
  }
  if (!(n in o) && Zl.test(n.trim())) {
    const r = Object.keys(o).filter(
      (s) => !qe(t, e, s) && o[s].trim().toLowerCase() === n.trim().toLowerCase()
    );
    return r.length > 0 ? `is a raw value. The token tier rule only allows tokens — use ${Wo(r)}.` : `is a raw value. The token tier rule only allows tokens — use the semantic ${e} token that matches the element's role.`;
  }
  return null;
}
function xn(t, e, n) {
  const o = e.tokenGroup;
  return o === "spacing" && Gt(t, n) ? "grid.8pt" : o && Ps(t, o, n) ? qe(t, o, n) ? "tokens.semantic-tier" : "tokens.only" : e.grid && typeof n == "number" && !Be(n) ? "grid.8pt" : "component.api";
}
function de(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function Go(t) {
  return t.length === 0 ? { ok: !0 } : { ok: !1, issues: t };
}
function zl(t, e, n = "faithful") {
  if (!de(t)) return Go([{ ruleId: "blueprint.dsl", path: [], message: "Blueprint must be a JSON object." }]);
  const o = [], r = (y, p, f, h) => {
    o.push({ ruleId: y, message: f, path: p, ...h ? { kind: h } : {} });
  };
  for (const y of Object.keys(t))
    kr.includes(y) || r("blueprint.dsl", [y], `Unknown key "${y}" next to "root" — ${zt(y)}. Remove it.`);
  if (t.version !== rn && r("blueprint.dsl", ["version"], `"version" must be ${rn} (got ${JSON.stringify(t.version)}).`), t.notes !== void 0) {
    const y = t.notes;
    (!Array.isArray(y) || y.length > dt || y.some((p) => typeof p != "string" || p.length === 0 || p.length > sn)) && r(
      "blueprint.dsl",
      ["notes"],
      `"notes" must be a list of at most ${dt} short strings (each up to ${sn} characters) — what the user should know about the result.`
    );
  }
  const s = [
    { id: typeof t.id == "string" && t.id ? t.id : Sr, screen: t.screen, root: t.root }
  ], i = [[]], a = [], l = (y, p) => (y.mode !== void 0 && !Tr.some((f) => f === y.mode) && r("blueprint.dsl", [...p, "mode"], '"mode" must be "faithful" or "exploratory" — and the pipeline sets it, not you.'), Ar(y, n));
  a.push(l(t, [])), t.screens !== void 0 && (Array.isArray(t.screens) ? (t.screens.length + 1 > Se && r("blueprint.dsl", ["screens"], `A document carries at most ${Se} screens (got ${t.screens.length + 1}).`), t.screens.slice(0, Se - 1).forEach((y, p) => {
    if (!de(y)) {
      r("blueprint.dsl", ["screens", p], `screens[${p}]: a screen must be an object { "id", "name", "screen", "root" }.`);
      return;
    }
    for (const f of Object.keys(y))
      xr.includes(f) || r("blueprint.dsl", ["screens", p, f], `screens[${p}]: unknown key "${f}" — the Blueprint DSL has no such key. Remove it.`);
    if (typeof y.id != "string" || !y.id) {
      r("blueprint.dsl", ["screens", p, "id"], `screens[${p}]: every further screen needs a string "id" — that is what "goTo" names.`);
      return;
    }
    s.push({ id: y.id, screen: y.screen, root: y.root }), i.push(["screens", p]), a.push(l(y, ["screens", p]));
  })) : r("blueprint.dsl", ["screens"], '"screens" must be a list of screens: [{ "id", "name", "screen", "root" }].'));
  const c = s.length > 1, d = (y, p) => r(p.ruleId, [...i[y], ...p.path], c ? `Screen "${s[y].id}": ${p.message}` : p.message, p.kind), u = Fl(s, e);
  s.forEach((y, p) => {
    const f = Hl({ version: rn, screen: y.screen, root: y.root }, e, a[p]);
    if (a[p] !== "exploratory") {
      f.issues.forEach((m) => d(p, m));
      return;
    }
    const h = u.filter((m) => m.screen === p);
    Ka([...f.issues, ...h], f.declarations, e).forEach((m) => d(p, m));
  });
  for (const y of u) a[y.screen] !== "exploratory" && d(y.screen, y);
  return Go(o);
}
function Hl(t, e, n) {
  const o = [], r = [], s = Rs(e, n);
  n === "exploratory" && (e = $t(e));
  const i = Object.keys(e.components), a = ze(e);
  if (!de(t.root))
    return {
      issues: [{ ruleId: "blueprint.dsl", path: ["root"], message: 'Blueprint must have a "root" node object.' }],
      declarations: r
    };
  if (de(t.screen)) {
    const l = U(e);
    if (t.screen.shades !== void 0 && n !== "exploratory")
      o.push({ ruleId: "blueprint.dsl", path: ["screen", "shades"], message: 'A Faithful screen uses one of the layer models, so its "screen" composes no "shades". Remove it.' });
    else if (t.screen.shades !== void 0 || t.screen.model === we) {
      const c = n === "exploratory" ? Mn(l, t.screen) : null;
      c && o.push({ ruleId: "blueprint.dsl", path: ["screen", "shades"], message: `"screen": ${c}` });
    } else n === "exploratory" && typeof t.screen.model == "string" && !Ke(l, t.screen.model) && o.push({
      ruleId: "blueprint.dsl",
      path: ["screen", "model"],
      message: `"screen".model ${JSON.stringify(t.screen.model)} is not a layer model. To compose a new overlay, use "model": "${we}" with its "shades", and declare layers.overlay-model on the screen.`
    });
  }
  if (de(t.screen) && t.screen[D] !== void 0) {
    const l = t.screen[D];
    n !== "exploratory" ? o.push({
      ruleId: "blueprint.dsl",
      path: ["screen", D],
      message: 'A Faithful screen keeps every pattern, so its "screen" declares no "deviation". Remove it.'
    }) : Array.isArray(l) ? l.forEach((c, d) => {
      const u = ["screen", D, d], y = xt(e, c, "screen");
      if (y) o.push({ ruleId: "blueprint.dsl", path: u, message: `"screen".deviation[${d}]: ${y}` });
      else {
        const { ruleId: p, why: f } = c;
        r.push({ ruleId: p, why: f, path: [], scope: "screen", at: u });
      }
    }) : o.push({
      ruleId: "blueprint.dsl",
      path: ["screen", D],
      message: '"screen".deviation must be a list: [{ "ruleId": "<rule id>", "why": "<the reason>" }].'
    });
  }
  return a && t.root.type !== a && o.push({
    ruleId: "frame.layout",
    path: ["root", "type"],
    message: `The root node must be a <${a}> (got ${JSON.stringify(t.root.type)}).`
  }), _n(t.root, "root", ["root"], { schemas: s, manifest: e, allowed: i, policy: n, declarations: r }, o, null), o.push(...cs(t, e)), { issues: o, declarations: r };
}
function _n(t, e, n, o, r, s) {
  var f;
  const i = (h, m, g) => {
    r.push({ ruleId: h, message: g, path: m });
  };
  if (!de(t)) {
    i("blueprint.dsl", n, `${e}: node must be an object.`);
    return;
  }
  const a = (h) => {
    Array.isArray(t.children) && t.children.forEach((m, g) => _n(m, `${e} › ${h}[${g}]`, [...n, "children", g], o, r, h));
  }, l = t.type;
  if (typeof l != "string") {
    i("blueprint.dsl", [...n, "type"], `${e}: node is missing a string "type".`), a("?");
    return;
  }
  const c = o.manifest.components[l];
  if (!c) {
    i("component.api", [...n, "type"], `${e}: <${l}> is not a real component. Allowed: ${o.allowed.join(", ")}.`), a(l);
    return;
  }
  const d = _r(o.policy, l);
  for (const h of Object.keys(t)) {
    if (d.includes(h)) continue;
    const m = h === D ? "a Faithful screen keeps every pattern, so it declares no deviation" : h === We && o.policy === "exploratory" ? "only a primitive says why no component would do" : zt(h);
    i("blueprint.dsl", [...n, h], `${e} <${l}>: unknown node key "${h}" — ${m}. Remove it.`);
  }
  if (o.policy === "exploratory" && l === Ue) {
    const h = de(t.props) && typeof t.props.description == "string" ? ` ("${t.props.description.slice(0, 60)}")` : "";
    r.push({
      ruleId: "registry.new-component",
      path: n,
      message: `${e} <Proposal>${h} is a component the registry lacks — it declares "deviation": { "ruleId": "registry.new-component", "why": "<why the registry lacks it>" }.`
    });
    const m = de(t[D]) ? t[D].ruleId : void 0;
    m !== void 0 && m !== "registry.new-component" && i("blueprint.dsl", [...n, D], `${e} <Proposal>: a Proposal declares "registry.new-component" and nothing else (got ${JSON.stringify(m)}).`);
  }
  if (o.policy === "exploratory" && yt(l)) {
    const h = Qr(o.manifest, t[We]);
    h && r.push({ ruleId: "primitives.reuse", kind: "invalid-reuse", path: [...n, We], message: `${e} <${l}>: ${h}` });
  }
  if (o.policy === "exploratory" && t[D] !== void 0) {
    const h = xt(o.manifest, t[D]);
    if (h) i("blueprint.dsl", [...n, D], `${e} <${l}>: ${h}`);
    else {
      const { ruleId: m, why: g } = t[D];
      o.declarations.push({ ruleId: m, why: g, path: n, scope: "node", at: [...n, D] });
    }
  }
  if (s === null && c.parents)
    i("layout.slots", n, `${e}: <${l}> only goes directly inside ${c.parents.map((h) => `<${h}>`).join(" or ")}.`);
  else if (s !== null) {
    const h = jr(o.manifest, s, l);
    h && i("layout.slots", n, `${e}: ${h}`);
  }
  const u = de(t.props) ? t.props : {}, y = o.schemas[l];
  if (Dn.includes(l))
    for (const h of Object.values(c.props))
      h.required && h.defaultValue === void 0 && u[h.name] === void 0 && i("component.api", [...n, "props", h.name], `${e} <${l}>: prop "${h.name}" is required — ${h.description ?? "set it"}.`);
  for (const h of Object.keys(u)) {
    const m = [...n, "props", h];
    if (!(h in c.props)) {
      i("component.api", m, `${e} <${l}>: unknown prop "${h}".`);
      continue;
    }
    const g = y.shape[h], b = g == null ? void 0 : g.safeParse(u[h]);
    if (b && !b.success) {
      const S = c.props[h].tokenGroup;
      if (S === "spacing" && Gt(o.manifest, u[h]))
        continue;
      const R = S ? Ps(o.manifest, S, u[h]) : null;
      if (R) {
        i(xn(o.manifest, c.props[h], u[h]), m, `${e} <${l}>: prop "${h}" = ${JSON.stringify(u[h])} ${R}`);
        continue;
      }
      const _ = c.props[h];
      if (_.type.name === "number" && (_.min !== void 0 || _.max !== void 0 || _.step !== void 0 || _.grid)) {
        const W = [
          _.step !== void 0 ? `a multiple of ${_.step}` : "a number",
          _.min !== void 0 && _.max !== void 0 ? `from ${_.min} to ${_.max}` : "",
          _.min !== void 0 && _.max === void 0 ? `of at least ${_.min}` : "",
          _.max !== void 0 && _.min === void 0 ? `of at most ${_.max}` : "",
          _.grid ? `on the 8pt scale (${_t()})` : ""
        ].filter(Boolean).join(" ");
        i(xn(o.manifest, _, u[h]), m, `${e} <${l}>: prop "${h}" = ${JSON.stringify(u[h])} must be ${W}.`);
        continue;
      }
      i(
        "component.api",
        [...m, ...((f = b.error.issues[0]) == null ? void 0 : f.path) ?? []],
        `${e} <${l}>: prop "${h}" = ${JSON.stringify(u[h])} is not an allowed value.`
      );
    }
  }
  if (t.children !== void 0 && !Array.isArray(t.children)) {
    const h = "children" in c.props ? ` To give <${l}> its words, set "props": { "children": ${JSON.stringify(t.children)} }.` : "";
    i("component.api", [...n, "children"], `${e} <${l}>: "children" is a list of nodes, not ${JSON.stringify(t.children)}.${h}`);
  }
  const p = Array.isArray(t.children) ? t.children : [];
  if (p.length > 0 && !c.acceptsChildren && i("component.api", [...n, "children"], `${e} <${l}>: cannot have children.`), c.acceptsChildren) {
    p.forEach((m, g) => _n(m, `${e} › ${l}[${g}]`, [...n, "children", g], o, r, l));
    const h = p.map((m) => de(m) && typeof m.type == "string" ? m.type : "");
    for (const m of Ea(c, h)) i("layout.slots", [...n, "children"], `${e}: ${m}`);
  }
}
const Ls = (t) => kt(t).filter((e) => e.flexibility === "law").map((e) => `${e.title} (${e.id})`).join("; "), Ms = (t) => ns(t).map((e) => `- ${e.id} — ${e.title}: ${e.statement}${Vt(e.id) === "node" ? " (on its node only)" : ""}`).join(`
`);
function Jl(t) {
  return `# Exploratory mode — declared deviations

This request may leave the design system's patterns. Plan what it needs, and say so.
- A LAW holds in every mode. It cannot be broken and cannot be declared: ${Ls(t)}.
- A PATTERN may be broken only when the plan says which one and why. For every break, add a line
  "Deviation: <rule id> — <why, in one short sentence, in the language of the request>" right under the
  component it happens at, or on the "Screen:" line when it concerns the whole screen. A rule marked
  "on its node only" always goes under its component.
- Break a pattern only when the request needs it. Everything else keeps the patterns. A plan that breaks
  nothing has no "Deviation:" line, and never lists a pattern it does not really break.
- A new overlay is composed, not invented: "screen": { "model": "composed", "level": <its level>, "shades": [ <from ${Ve.map((e) => `"${e}"`).join(", ")}, each once> ], "deviation": [ { "ruleId": "layers.overlay-model", "why": … } ] }. Any other model name must be one of the layer models.

Patterns that may be broken (id — what it is):
${Ms(t)}

`;
}
function Wl(t) {
  return `

# Exploratory mode — declared deviations

This screen may break a PATTERN of the design system, and only by declaring it. A LAW is never broken and never
declared: ${Ls(t)}.

This mode adds one field to the node fields above: "deviation": { "ruleId": "<pattern id>", "why": "<the reason, one short
sentence in the language of the request, up to ${vn} characters>" }.
- Put it on the node where the break happens; it covers that node and everything inside it. The plan's "Deviation:" lines say which.
- A break that belongs to the whole screen goes in "screen": { "model": …, "level": …, "deviation": [ { "ruleId": …, "why": … } ] }.
  A rule marked "on its node only" is never declared there: declare it on the node where it happens.
- Break a pattern only when the request needs it.
- Declare exactly the patterns the screen really breaks. A break that is not declared is an error, and so is a declaration
  that nothing breaks. Declaring a different rule does not cover the break.
- Never declare a law, and never declare a rule that is not in the list below.
- A new overlay is composed, not invented: "screen": { "model": "composed", "level": <its level>, "shades": [ <from ${Ve.map((e) => `"${e}"`).join(", ")}, each once> ], "deviation": [ { "ruleId": "layers.overlay-model", "why": … } ] }. Any other model name must be one of the layer models.

Patterns that may be declared (id — what it is):
${Ms(t)}`;
}
function Gl(t, e) {
  const n = $t(t).components[e];
  return Object.values(n.props).map((o) => o.options && o.tokenGroup ? `${o.name} (${o.options.join(" | ")})` : o.tokenGroup ? `${o.name} (a ${o.tokenGroup} token, same names as the components use)` : o.options ? `${o.name} (${o.options.join(" | ")})` : `${o.name}${o.required ? " (required text)" : ""}`).join(", ");
}
function Yl() {
  return `# Exploratory mode — beyond the registry

Prefer the registry's components, recomposed. Only when none of them expresses the need:
- a small piece the registry lacks (a coloured title, a wrapper that groups pieces) is a PRIMITIVE —
  ${Wt.join(", ")}. For each, add a line "Primitive: <type> — considered <the components you
  looked at, by name> — <why none of them does it>".
- a part the registry has no component for (one with props of its own) is a PROPOSAL — add a line "Proposal:
  <what it is> — <its props: name: type, …>". It is shown as a placeholder, not built. If your notes would say
  "the registry has no X", that is a Proposal for X, not an approximation with other components.
At most ${ft} primitives inside each other and ${mt} per screen, text included: past that, it is a Proposal.
A request that fits the registry uses no primitive and no Proposal.
Example — for the request "${Xl}", the registry has no slider, so the plan carries:
  Proposal: Volume slider — a horizontal track with a handle that shows the current level — props: level: number, muted: boolean
and no line that approximates it with a row of buttons.

`;
}
function Kl(t) {
  return `

# Exploratory mode — beyond the registry

Prefer the registry's components. Use the vocabulary below only when no component expresses the need; a
request that fits the registry uses none of it. The laws hold for it exactly as for components: tokens only
(never a hex, px or rgb), the semantic tier, the 8pt grid, only the props listed.

Primitives — each carries "reuse": { "considered": "<the registry components you looked at, by id, comma-separated>",
"why": "<why none of them expresses the need, in the language of the request>" }. "considered" names real
components (${Object.keys(t.components).join(", ")}); a primitive without a valid "reuse" is an error.
${Wt.map((n) => `- ${n}: ${Gl(t, n)}${$t(t).components[n].acceptsChildren ? "; holds children" : "; no children"}`).join(`
`)}
Budget: at most ${ft} primitives nested in primitives, and ${mt} per screen, primitive:Text included.
Past it, the need is a new component: group it into one Proposal.

Proposal — a component the registry lacks, shown as a placeholder and never built. If your notes would say "the registry has no X",
declare a Proposal for X instead of approximating it with other components:
{ "type": "Proposal", "props": { "description": "<what it is and does>", "proposedApi": { "<propName>": "<short type or description>" } },
  "deviation": { "ruleId": "registry.new-component", "why": "<why the registry lacks it>" } }
proposedApi has 1 to ${kn} props, each an identifier (letters and digits) with a short string. A Proposal has no children and
declares registry.new-component — nothing else, on its own node.`;
}
const Xl = "a volume slider on the clean broadcast";
function Ql(t) {
  return t === "exploratory" ? 'If the request needs a part the registry lacks, declare a Proposal for it (see "Exploratory mode — beyond the registry" below) instead of approximating it with other components. Never build a component of your own.' : "If the request needs something the registry lacks, approximate it with the layout primitives and name what you approximated. Never invent a component.";
}
function ec(t) {
  return t === "exploratory" ? 'When the need is not in the registry, the plan carries a "Proposal:" line (see above), not a "Notes:" line about approximating it. When a law overrides part of the request, end the plan with a "Notes:" line saying so plainly, in the language of the request.' : 'When you had to approximate something the registry lacks, or a law overrides part of the request, end the plan with a "Notes:" line saying so plainly, in the language of the request.';
}
function tc(t) {
  return t === "exploratory" ? "when a Proposal stands in for something the registry lacks (say what it stands in for), or a law overrode part of their request" : "when you approximated something the registry lacks, or a law overrode part of their request";
}
function nc(t, e) {
  const n = Object.values(t.props).map((o) => {
    const r = o.tokenGroup, s = r === "spacing", i = r ? Ht(e, r) : [], a = s ? rt(e, i) : i, l = r && o.options ? o.options.filter((d) => !qe(e, r, d)) : o.options, c = s && l ? rt(e, l) : l;
    return {
      name: o.name,
      control: Ta(o),
      ...o.description ? { description: o.description.replace(/\s+/g, " ").trim() } : {},
      ...o.nullable ? { nullable: !0 } : {},
      options: c,
      ...a.length > 0 ? { tokenNames: a } : {},
      default: o.defaultValue,
      ...o.min !== void 0 ? { min: o.min } : {},
      ...o.max !== void 0 ? { max: o.max } : {},
      ...o.step !== void 0 ? { step: o.step } : {},
      ...o.grid ? { grid: !0 } : {},
      ...o.fields ? { fields: Object.values(o.fields).map((d) => `${d.name}${d.required ? "" : "?"}`) } : {}
    };
  });
  return {
    type: t.id,
    category: t.category ?? "component",
    summary: t.description,
    acceptsChildren: t.acceptsChildren,
    ...t.slots ? { slots: t.slots } : {},
    ...t.parents ? { parents: t.parents } : {},
    props: n
  };
}
function Bs(t = Ce) {
  return Object.values(t.components).map((e) => nc(e, t));
}
const oe = (t) => `${t}px`;
function oc() {
  return `You are the screen generator: you turn a screen plan into a Blueprint JSON (DSL) layout built from the active design system's component registry and tokens.

A validator checks every blueprint against the global laws below and sends back any blueprint that breaks one, with its errors.`;
}
function rc() {
  return `### 1. BLUEPRINT JSON FORMAT & TOKENS
* **Output:** Blueprint JSON DSL — not React components, JSX or raw HTML.
* **Tokens:** Typography, colors, radii, spacing and dimensions are all assigned with our global design tokens — never a raw pixel value (e.g., \`${oe(E.gutter)}\`) or a hex/RGB color code.`;
}
function Ds() {
  const [t, e] = E.offGridAllowed, n = [1, 2, 3, 4, 5, 6, 8].map((o) => o * E.grid).join(", ");
  return `### 2. THE SPATIAL PHYSICS & EXCEPTIONS
The application operates on a strict mathematical ${E.grid}-point grid.
* Standard dimensions, margins, paddings, heights, and offsets are multiples of ${E.grid} (e.g., ${n}).
* **Exceptions:** \`${oe(t)}\` (half-step) and \`${oe(e)}\` (1.5 step) are explicitly permitted for micro-spacing and tight component internals.
* Never output fractional pixels or any other off-grid values outside of the allowed ${E.grid}pt scale and the ${oe(t)}/${oe(e)} exceptions.`;
}
function Fs() {
  const { width: t, height: e } = E.base;
  return `### 3. MACRO-LAYOUT & ${t}×${e} CANVAS BOUNDARIES
When generating full screens or master containers, you must target the base HD canvas (the engine will handle the upscale switch).
* **Master Viewport:** The outermost container is strictly locked to **${oe(t)} by ${oe(e)}** by the engine — never try to size it yourself.
* **Safe Area Margins:** A strict **${oe(E.margin)} margin** applies on all outer edges (Top, Bottom, Left, Right). The engine applies it as the canvas safe area, so the outermost container adds no padding of its own. Content cannot breach this safe area.
* **Gutters:** The space between structural columns or module stacks must be exactly **${oe(E.gutter)}**.
* **Stretch:** The outermost container always stretches its children across the frame — its cross-axis alignment is "stretch". A module that belongs on the right or the left positions itself inside it (a row set to justify to the end or the start, or the component's own alignment prop); the outermost container itself never aligns to a side.
* **Dynamic Focus Alignment:** Master layouts do not use static center alignment. This is a TV canvas: something always holds focus, and the engine reads where it is — you never declare a focus side.
  * Initial focus lands on the first focusable element (a button or an input) in reading order — top to bottom, then left to right — within the screen's content. Keep the screen's primary actions (e.g. "Play", "Watch now", "Continue") in the content, placed where focus should start.
  * Optionally, mark ONE secondary floating cluster — quick actions or utility controls such as options, filters or help, never the screen's primary actions — with "anchor": true on a direct child of the outermost container. The engine lifts it out of the content flow into a bottom corner of the frame, and an anchored element never holds initial focus (except where the screen's level says focus starts on it — the third level's rounded button). If the focus is on the right — or nothing is focusable — the engine anchors it to the **Bottom-Right** (respecting the ${oe(E.margin)} margin); if the focus is on the left, it mirrors the alignment and anchors it to the **Left** margin, at the bottom.`;
}
function sc(t) {
  return `### 4. COMPONENT REGISTRY STRICTNESS
Build the UI from the Blueprint component definitions below (imported and mapped from our Storybook registry).
* Use only the props a component's schema defines.

Compose, don't assume. Treat the components as building blocks and combine them freely to match what the user asks, including unconventional arrangements. Composition happens inside the frame, token, layer and focus laws, which always win. Placement rules on a component (which parent it needs, its slot order) still apply. A reference screen is a starting point, and the request can override it. ${Ql(t)}`;
}
function Vs() {
  return `### 5. TOKEN TIERS
Design tokens are tiered, and the tier decides whether you may name a token:
* **Core:** ${Ge.core}
* **Semantic:** ${Ge.semantic}
* **Layout scale:** ${Ge.layout}
* A blueprint that names a core token or a raw value is rejected. When no semantic token matches a role exactly, pick the closest role — never fall back to a core token.`;
}
function qs() {
  var t;
  return `### 6. SCREEN LAYERS — THE LAYER RULE (CAMADAS)
The whole design system rests on this rule. Every screen is three layers, bottom to top: **video → overlay → content**.
* **Your blueprint is the content layer only.** The engine paints the video and the overlay under it, so the outermost container stays transparent — never paint a full-screen background, gradient, shade or scrim yourself.
* **The overlay is never free-form.** Pick ONE layer model for the screen, and the engine paints that model's fixed combination of shades. Declare it next to "root": \`"screen": { "model": "<model id>", "level": <navigation level> }\`.
* **Pick the model by the screen type and by where its components sit.** A model that shades one side needs the content — and so the TV focus — on that side; a model without a side spans the frame.
* **Navigation levels limit what a screen shows.** A model fixes the level, and a level that shows one module holds exactly one content container as the only un-anchored child of the outermost container.
* **One document can hold several screens** (at most ${Se}). The first is "root" (with its "screen"); every further one goes in \`"screens": [{ "id": "<unique id>", "name": "<short label>", "screen": { "model", "level" }, "root": {…} }]\`. When the user asks for options, versions or alternatives ("give me three"), return exactly that many screens, each a genuinely different composition of the same request — they need no links. Give every screen a short "name" ("Option A").
* **A prototype is clickable.** When the user asks for a flow, a prototype, or what happens when something is clicked, return one screen per step and put \`"goTo": "<screen id>"\` on the element (a button, a card, a menu item) that opens it. Links follow the levels: an element on a level N screen opens a level N+1 screen — Home (1) → the focused rail (2) → one interactivity (3) — never skipping a level, and every screen carries the model of its own level. Focus tells the pages apart: on Home the focus is on the main menu (the program button by default), and the interactivity buttons resting there link to the second-level screen (a focus on them IS that page); on the second level the focus is on one interactivity button, which links to the third-level screen; on the third level the focus starts on the rounded button. The home menu's buttons each own a rail: ${ic()} On Home the focus starts on the ${((t = U(Ce).menu) == null ? void 0 : t.initial) ?? "program"} button; when the Home rail sits on the left, the focus is on the left button that owns it. The rail holds exactly the interactivities the request asks for — one asked, one card; never pad it with a reference screen's other cards — and the second-level rail shows the same cards as the Home rail it is entered from. The main menu never carries a link. A back button (RoundedButton) always returns exactly one level (3 → 2, 2 → 1); a close button (CloseButton) closes everything and returns to Home — use each for its own job. Name the first screen's "id" next to "root" only when another screen links back to it. A screen nothing links to is an option, not a step. Options may differ in layer model — a left and a right variant, say — but every option stays on the level and the focus rule of the model it names.`;
}
function ic() {
  const t = U(Ce).menu;
  return t ? t.roles.map((e) => `${e.name} (${t.prop} "${e.item}") — its interactivity buttons sit on the ${e.side} and hold ${e.holds}`).join("; ") + "." : "";
}
function ac(t = "faithful") {
  return [oc(), rc(), Ds(), Fs(), sc(t), Vs(), qs()].join(`

`);
}
function lc(t) {
  const e = t.description ? ` — ${t.description}` : "";
  return `${cc(t)}${e}`;
}
function cc(t) {
  const e = JSON.stringify(t.default);
  if (t.options) return `      - ${t.name}: one of [${t.options.join(", ")}]${t.nullable ? " or null" : ""} (default ${e})`;
  if (t.tokenNames)
    return `      - ${t.name}: a token name, one of [${t.tokenNames.join(", ")}] (default ${e})`;
  if (t.control === "boolean") return `      - ${t.name}: boolean (default ${e})`;
  if (t.control === "number") {
    const o = [
      t.step !== void 0 ? `a multiple of ${t.step}` : "",
      t.min !== void 0 && t.max !== void 0 ? `from ${t.min} to ${t.max}` : "",
      t.grid ? `on the 8pt scale (${_t()})` : ""
    ].filter(Boolean).join(" ");
    return `      - ${t.name}: number${o ? `, ${o}` : ""} (default ${e})`;
  }
  if (t.control === "list") {
    const o = t.min !== void 0 && t.min === t.max ? `, exactly ${t.min}` : t.max !== void 0 ? `, at most ${t.max}` : "", r = t.fields ? `objects { ${t.fields.map((s) => `${s}: string`).join(", ")} }` : "strings";
    return `      - ${t.name}: a JSON array of ${r}${o} (default ${e})`;
  }
  const n = typeof t.default == "string" && t.default !== "" ? ', shown when left out — set "" for none' : "";
  return `      - ${t.name}: string (default ${e}${n})`;
}
function dc(t) {
  return t.some((e) => e.props.some((n) => n.name === "children" && n.control !== "list")) ? [
    `* **Text as children:** a component that shows words (its "children" prop says so below) takes them in that prop — "props": { "children": "Atualizado há 1 min" }. A node's own "children" is always a list of nodes, never text.`
  ] : [];
}
function uc(t) {
  return [
    `  <${t.type}> — ${t.summary}`,
    `    accepts children: ${t.slots ? `only ${t.slots.map((e) => `<${e}>`).join(", ")} — in that order, each at most once, any may be left out` : t.acceptsChildren ? "yes" : "no"}`,
    ...t.parents ? [`    goes only directly inside: ${t.parents.map((e) => `<${e}>`).join(" or ")}`] : [],
    "    props:",
    ...t.props.map(lc)
  ].join(`
`);
}
function hc(t) {
  return t.map((e) => `  - <${e.type}>${e.acceptsChildren ? " (container)" : ""}: ${e.summary}${pc(e.props)}`).join(`
`);
}
function pc(t) {
  const e = t.filter((o) => o.control === "list" && o.name !== "children");
  if (e.length === 0) return "";
  const n = (o) => {
    const r = o.fields ? `{${o.fields.join(", ")}}` : "text", s = o.description ? ` — ${o.description.split(new RegExp("(?<=\\.)\\s"))[0]}` : "";
    return `${o.name} (${o.max !== void 0 ? `up to ${o.max} ` : ""}${r} items)${s}`;
  };
  return ` Lists: ${e.map(n).join("; ")}`;
}
const fc = { semantic: "semantic", layout: "layout scale" };
function Us(t) {
  const e = (r, s) => r !== "spacing" ? s : rt(t, s).map((i) => {
    const a = ue(t, i);
    return a === null ? i : `${i} = ${oe(a)}`;
  }), n = ["spacing", "colors", "radius", "shadow"], o = [];
  for (const r of n) {
    const s = Ht(t, r);
    if (s.length === 0) continue;
    if (s.filter((l) => Ye(t, r, l) !== void 0).length === 0) {
      const l = e(r, s);
      l.length > 0 && o.push(`${r} [${l.join(", ")}]`);
      continue;
    }
    for (const l of ["semantic", "layout"]) {
      const c = e(r, s.filter((d) => Ye(t, r, d) === l));
      c.length > 0 && o.push(`${r} — ${fc[l]} [${c.join(", ")}]`);
    }
    const a = e(r, s.filter((l) => Ye(t, r, l) === void 0));
    a.length > 0 && o.push(`${r} [${a.join(", ")}]`);
  }
  return o.length > 0 ? o.join("; ") : "named tokens only — never raw numbers";
}
function mc(t) {
  const e = /* @__PURE__ */ new Set();
  let n = 0;
  for (const [o, r] of Object.entries(Rn(t).tiers))
    for (const [s, i] of Object.entries(r ?? {}))
      i !== "core" || !(s in (t.tokens[o] ?? {})) || (n++, e.add(`${s.split("-")[0]}-*`));
  return { count: n, families: [...e] };
}
const yc = 12;
function gc(t) {
  const e = [];
  for (const n of jn(t, "colors")) {
    if (!qe(t, "colors", n)) continue;
    const o = Pn(t, "colors", n);
    if (!(o.length === 0 || o.length > 2) && (e.push(`\`${n}\` → ${o.map((r) => `\`${r}\``).join(" or ")}`), e.length === yc))
      break;
  }
  return e;
}
function Zs(t) {
  const { count: e, families: n } = mc(t);
  if (e === 0) return [];
  const o = Rn(t), r = [
    `* **Token tiers:** only the semantic and layout-scale tokens listed above may be named. This system's ${e} core tokens (${n.join(", ")}) are never assigned.`
  ], s = gc(t);
  s.length > 0 && r.push(`* **Core → semantic:** these core values already have a semantic name — name that instead: ${s.join("; ")}.`);
  const i = ["core", "semantic", "layout"].filter((a) => o.rule[a] !== Ge[a]);
  for (const a of i) r.push(`* **${a} tier, as this system defines it:** ${o.rule[a]}`);
  return r;
}
function zs(t, e) {
  const n = U(t);
  if (n.models.length === 0) return [];
  const o = wt(t, { type: e }), r = Jt(t, { type: e }), s = (a, l) => `${a === null ? "No module limit" : `Shows at most ${a} content module${a === 1 ? "" : "s"}`}; ${l ? "may anchor one cluster" : "anchors nothing"}.`, i = [
    `* **Layer rule:** ${n.rule}`,
    "* **Navigation levels (screen.level):**",
    ...n.levels.map((a) => {
      const l = a.rootEnd ? ` **The stack:** the outermost container is a column (direction vertical) that sits at the end of the frame (justify "end"${n.models.some((c) => c.level === a.level && c.allowsRootStart) ? ", except where a model below says its stack starts at the top" : ""}), still stretching across it; ${a.maxModules === 1 ? "the one module that belongs on one side sits in a row inside it." : 'each module stacks in order and places itself on its own side (its own align/justify, or a row set to justify "start"/"end").'}` : a.rootColumn ? ' **The stack:** the outermost container is a column (direction vertical), still stretching across it — never a row. Its content can sit at both the top and the bottom of the frame (not only at the end), so each module places itself with its own align/justify, or a row set to justify "start"/"end".' : "";
      return `  - ${a.level} · ${a.name} — ${a.rule} ${s(a.maxModules, a.allowsAnchor)}${l}${a.initialFocus ? ` **Initial focus:** ${a.initialFocus.hint}` : ""}`;
    }),
    "* **Layer models (screen.model):**",
    ...n.models.map(
      (a) => `  - "${a.id}" — ${a.name} · level ${a.level} · ${a.side ? `${a.side} side` : "spans the frame"} · shades ${a.shades.join(" + ")}. ${a.use}`
    )
  ];
  return o && i.push(
    `* **Content side:** under a right model the outermost <${e}> sets ${o.prop} "${o.values.right}"; under a left model, ${o.prop} "${o.values.left}".`
  ), r && i.push(`* **Transparent content layer:** the outermost <${e}> sets ${r.prop} "${r.clear}"; surfaces belong to the cards inside it.`), i;
}
function Yo(t) {
  var r;
  const e = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), o = [];
  for (const s of Object.values(t.components))
    for (const i of Vn(s)) {
      const a = Tt(i), l = ((r = i.options) == null ? void 0 : r.includes("focus")) ?? !1;
      e.set(i.name, l ? `${i.name} "focus"` : `${i.name} (any value but ${JSON.stringify(a)})`), n.set(i.name, `${i.name} ${JSON.stringify(a)}`);
      const c = Ze(i);
      (l ? c === "focus" : typeof c == "string" && c !== a) && o.push(`<${s.id}> focuses its ${JSON.stringify(c)} unless you set ${n.get(i.name)}`);
    }
  return e.size === 0 ? null : `* **One focus:** a TV screen has exactly one focused element — the one the viewer is on. ${[...e.values()].join(", or ")} puts an element in focus; every other element takes its resting value (${[...n.values()].join(", ")}).` + (o.length > 0 ? ` Note: ${o.join("; ")}.` : "");
}
function Hs(t, e) {
  const n = t.components[e], o = n ? Oe(n, "margin") : void 0, r = n ? Oe(n, "gutter") : void 0, s = o ? Ee(t, Ie(t, o), 0) : void 0, i = r ? Ee(t, Ie(t, r), E.gutter) : void 0, a = n ? St(n) : void 0, l = n ? Fn(n).filter((c) => c !== a).map((c) => c.name) : [];
  return [
    `* **Safe area:** ${o && s ? `the outermost <${e}> sets ${o.name} "${s}".` : `the outermost <${e}> sets no padding.`}`,
    `* **Gutters:** ${r && i ? `the outermost <${e}>, and any <${e}> of the layout whose children are all containers (stacked modules, columns), set ${r.name} "${i}". Inside a module (a card, a menu) spacing is the module's own — this rule stops there.` : `stacked modules and columns sit ${oe(E.gutter)} apart; inside a module (a card, a menu) spacing is the module's own.`}`,
    `* **Stretch:** ${a ? `the outermost <${e}> keeps ${a.name} "stretch" — a module that belongs on one side positions itself inside it.` : `the outermost <${e}> spans the frame; a module that belongs on one side positions itself inside it.`}`,
    `* **No static centering:** ${l.length > 0 ? `the outermost <${e}> never sets ${l.join(" or ")} to "center".` : `the outermost <${e}> is never centered.`}`,
    `* **Anchoring:** "anchor": true goes on a direct child of the outermost <${e}> — at most one per screen, and only on a secondary floating cluster, never the screen's primary actions — and never on the main menu or the interactivity buttons, which hold the focus in the content. The third level's rounded button is the one focus holder that is anchored.`,
    ...Yo(t) ? [Yo(t)] : []
  ];
}
function vc(t, e, n) {
  const o = e.filter((a) => a.acceptsChildren && !a.slots && !a.parents).map((a) => a.type), r = e.filter((a) => !a.acceptsChildren).map((a) => a.type), s = e.filter((a) => a.slots), i = Js(t.components[n]);
  return [
    `### 7. ACTIVE DESIGN SYSTEM — ${t.name} (v${t.version})`,
    "The laws above, mapped onto this system's registry and tokens.",
    `* **Components:** only ${e.map((a) => a.type).join(", ")}. The outermost container is a <${n}>.`,
    `* **Layout:** there is no absolute positioning. Every layout is nested containers (${o.join(", ") || n}), each a flexbox row or column: "gap" spaces its children, "padding" is inner spacing${i ? `, "${i.prop}": "${i.row}" makes a row` : ""}. Only containers hold children${r.length ? `; ${r.join(", ")} are leaves` : ""}.`,
    ...dc(e),
    '* **Defaults show:** a prop you leave out renders the default listed beside it — placeholder text included. Set a text prop to "" to leave its text off the screen.',
    ...s.map(
      (a) => `* **<${a.type}> is composed:** its only children are ${a.slots.map((l) => `<${l}>`).join(", ")} — in that order, each at most once. Leave out any it does not need; never put anything else inside it, and never use those parts anywhere but directly inside a <${a.type}>.`
    ),
    `* **Tokens:** ${Us(t)}. A prop listed below as "a token name" takes exactly one of its listed names, or is omitted.`,
    ...Zs(t),
    ...Hs(t, n),
    ...zs(t, n),
    '* **Structure:** group related content in a container, give cards a surface + border + radius + shadow, use text "variant" for hierarchy.'
  ].join(`
`);
}
function Wn(t) {
  return t.templates ?? [];
}
function Js(t) {
  var o;
  const e = t && qn(t), n = (o = e == null ? void 0 : e.prop.options) == null ? void 0 : o.find((r) => r !== e.column);
  return e && n ? { prop: e.prop.name, row: n, column: e.column } : void 0;
}
function ce(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function bc(t) {
  if (!ce(t) || !ce(t.root)) return [];
  const e = ["direction", "align", "justify"], n = (s) => {
    const i = typeof s.type == "string" ? s.type : "?", a = ce(s.props) ? s.props : {}, l = e.filter((c) => a[c] !== void 0).map((c) => String(a[c]));
    return `${i}${l.length > 0 ? ` (${l.join(", ")})` : ""}${s.anchor ? " anchored" : ""}`;
  }, o = [n(t.root)], r = (s, i) => {
    const a = (Array.isArray(s.children) ? s.children : []).filter(ce), l = [];
    for (const c of a) {
      const d = n(c), u = l[l.length - 1];
      u && u.text === d ? u.count++ : l.push({ node: c, text: d, count: 1 });
    }
    for (const { node: c, text: d, count: u } of l)
      o.push(`${"  ".repeat(i)}${d}${u > 1 ? ` × ${u}` : ""}`), u === 1 && r(c, i + 1);
  };
  return r(t.root, 1), o;
}
const wc = ["title", "label", "children", "subtitle", "overline"], $c = ["direction", "align", "justify", "gap", "padding"];
function kc(t, e, n, o) {
  const r = t.find((i) => i.id === "home") ?? t[0], s = r && ce(r.blueprint) && ce(r.blueprint.root) ? r.blueprint.root : void 0;
  if (r && s) {
    const i = ce(r.blueprint) && ce(r.blueprint.screen) ? r.blueprint.screen : void 0, a = (y) => {
      const p = typeof y.type == "string" ? y.type : "?", f = ce(y.props) ? y.props : {}, h = $c.filter((g) => f[g] !== void 0).map((g) => `${g} ${JSON.stringify(f[g])}`), m = wc.map((g) => f[g]).find((g) => typeof g == "string" && g.length > 0);
      return `${p}${h.length > 0 ? ` (${h.join(", ")})` : ""}${y.anchor ? " (anchored)" : ""}${m ? ` — "${m}"` : ""}`;
    }, l = [];
    let c = 0;
    const d = (y, p) => {
      c++, l.push(`${c}. ${"  ".repeat(p)}${a(y)}`);
      for (const f of (Array.isArray(y.children) ? y.children : []).filter(ce)) d(f, p + 1);
    };
    d(s, 0);
    const u = i ? `Screen: model "${i.model}", level ${i.level} — ${r.when}` : `Screen: ${r.when}`;
    return `Template: ${r.id}
${u}
${l.join(`
`)}`;
  }
  return `Screen: model "<layer model id>", level <n> — why this model fits where the content sits.
1. Root ${e} (vertical, gap ${n ?? "md"}, padding ${o ?? "none"}, align stretch, no background) — the content layer.
2.   Header ${e} (vertical, gap xs).
3.     A prominent title: "Choose your plan".
4.     A muted body line: "Switch or cancel at any time.".
5.   Card ${e} (vertical, gap md, padding lg, surface, bordered, radius lg, shadow sm).
6.     A heading: "Premium".
7.     A muted body line: "Every channel, live and on demand.".
8.     Primary button: "Start watching" — first focusable, so it holds initial focus.
9.   Help ${e} (horizontal, gap sm) — anchored, a secondary floating cluster.
10.    Ghost button: "Need help?".`;
}
function xc(t) {
  return t.length === 0 ? "" : `# Reference screens

These screens are already built and already obey every law above. Start from one
whenever the request is that screen or a variation of it — it is faster and safer
than composing from nothing, and the next agent is given its JSON to adapt. The
indented lines under each one are its root's real shape (component, then layout
props) — read it before describing your own plan's structure.

${t.map((e) => `- ${e.id} — ${e.name}. ${e.when}
${bc(e.blueprint).map((n) => `    ${n}`).join(`
`)}`).join(`
`)}

Name your choice on the first line, before the screen line:
Template: <id>, or "Template: none" when the request is a screen none of these fit.
Choosing one does not end your job: still write the plan, saying what changes.

`;
}
function Ws(t = Ce, e) {
  var p;
  const n = Bs(t), o = ze(t) ?? ((p = n.find((f) => f.acceptsChildren)) == null ? void 0 : p.type) ?? "Stack", r = Us(t), s = Wn(t), i = t.components[o], a = i ? Oe(i, "margin") : void 0, l = i ? Oe(i, "gutter") : void 0, c = a ? Ee(t, Ie(t, a), 0) : void 0, d = l ? Ee(t, Ie(t, l), E.gutter) : void 0, u = Js(i), y = U(t).models.length > 0;
  return `You are the PLANNER for ScreenFlow Studio. Given a request for a screen,
you write a short, concrete build plan — which components to use and how to nest
them in ${o}s. You do NOT write JSON or code; the next agent does that.

# Product Blueprint

Design system: ${t.name} (v${t.version})
- The primary layout tool is <${o}> — a flex row${u ? ` ("${u.prop}": "${u.row}")` : ""} or column${u ? ` ("${u.column}")` : ""}. Build every layout by nesting them. There is no
  absolute positioning, no grid.${y ? ` The outermost <${o}> is a column on every screen — see the layer rule's levels below.` : ""}
- Design tokens available (spacing, colors, radius, shadow): ${r}.
- Components available:
${hc(n)}

# Global laws your plan must obey

${Ds()}

${Fs()}

${Vs()}

${qs()}

In ${t.name}:
${[...Zs(t), ...Hs(t, o), ...zs(t, o)].join(`
`)}

Accessibility rules:
- Every button label must say what it does ("Create account", not "Submit").
- Use a muted tone for secondary text, never a faint custom color.
- Name every color by its role (primary text, elevated surface, default border),
  never by its look — the token tier rule allows semantic tokens only.

${e ? _c(t, e.prompt) : ""}${(e == null ? void 0 : e.mode) === "exploratory" ? Jl(t) + Yl() : ""}${xc(s)}# Output format

First the template line, then the screen line — its layer model, its level, and why that model fits where
the content sits. Then a numbered list. Each line: the component, its role, its
nesting, and its text content; mark the anchored group.
When the request asks for several options, or for a clickable flow, plan every screen: a "Screens:" line
listing each one (its id, a short name, its model and level — and for a flow, which element links to which
screen), then the numbered list for each screen under its own "Screen <id>:" heading.
${ec(e == null ? void 0 : e.mode)}
Example:

${kc(s, o, d, c)}

${(e == null ? void 0 : e.mode) === "exploratory" ? `Write the plan's "Notes:" line, each "Deviation:" reason and each "Proposal:" description in the language of the user's request, whatever language these instructions are in. Rule ids and component names stay as they are.` : `Write the plan's "Notes:" line in the language of the user's request, whatever language these instructions are in. Component names stay as they are.`}`;
}
function _c(t, e) {
  const n = Ha(t, Hn(e, t).components);
  return n.length === 0 ? "" : `# Rules for the components this request names

${n.map((r) => `- ${r.title} — ${r.flexibility} (${r.id}): ${r.statement}`).join(`
`)}

`;
}
function Sc(t = "tool", e = Ce, n = "faithful") {
  var a;
  const o = Bs(e), r = ze(e) ?? ((a = o.find((l) => l.acceptsChildren)) == null ? void 0 : a.type) ?? "Stack", s = `"version": 1,
  "screen": { "model": "<layer model id>", "level": <that model's level> },
  "root": { "type": "${r}", "props": { ... }, "children": [ ... ] }
  (only for several screens: "screens": [ { "id": "...", "name": "...", "screen": { ... }, "root": { ... } } ]),
  (only when there is something to tell the user: "notes": [ "..." ])`, i = t === "tool" ? `Return the Blueprint by calling the ${ct} tool exactly once with:
{
  "blueprint": {
    ${s.replaceAll(`
`, `
  `)}
  }
}` : `Respond with ONLY this JSON object and nothing else — no prose, no explanation,
no markdown fences:
{
  ${s}
}`;
  return `${ac(n)}

${vc(e, o, r)}

# Components
${o.map(uc).join(`

`)}

# Output
${i}
Omit props you don't need — defaults are applied. The document has exactly three
fields: "version", "screen" and "root" (plus "id"/"name" for the first screen and "screens" when the
request asks for several screens). Do not include an "id" field on any node —
besides "type", "props" and "children", the only node fields are "anchor" and "goTo".

Tell the user what they would otherwise not notice: ${tc(n)} (focus starting somewhere other than where they asked, a level's one-module limit, a component that only goes inside another), add up to ${dt} short sentences to "notes" — a list of strings, in the language of the request. Say it plainly. Omit "notes" when the result is exactly what was asked. Notes describe the result against the request — never your own corrections after a rejected attempt.${n === "exploratory" ? Wl(e) + Kl(e) + `

Write every piece of text meant for the user — "notes", each "deviation.why", a Proposal's "description" — in the language of the user's request, whatever language these instructions are in. Rule ids and component names stay as they are.` : `

Write every piece of text meant for the user — "notes" — in the language of the user's request, whatever language these instructions are in. Component names stay as they are.`}`;
}
function Gs() {
  return `n_${crypto.randomUUID().slice(0, 8)}`;
}
function Ys(t, e = {}, n = []) {
  return { id: Gs(), type: t, props: e, children: n };
}
function Tc(t) {
  return structuredClone(t);
}
function Ks(t) {
  return 1 + t.children.reduce((e, n) => e + Ks(n), 0);
}
const Ko = 1, Xs = /* @__PURE__ */ new Map(), Gn = (t, e) => e ? new Map([...t, [e.ruleId, e.why]]) : t;
function De(t, e, n, o, r) {
  t.push({
    ruleId: n,
    level: "info",
    path: o,
    message: `Kept ${r} — the screen declares a deviation from "${n}" (${e.get(n)}).`
  });
}
function Xo(t, e, n, o, r, s) {
  if (!e.has(t)) return s(n, o);
  const i = [];
  s(Tc(n), i), i.length > 0 && De(o, e, t, "root", r);
}
function Qs(t, e, n, o) {
  if (!G(t) || t[D] === void 0) return [];
  const r = t[D];
  return n !== "exploratory" ? (o == null || o.push({ ruleId: "blueprint.dsl", level: "warn", path: "screen", message: 'Removed "deviation" from the screen — a Faithful screen keeps every pattern.' }), []) : Array.isArray(r) ? r.flatMap((s, i) => {
    const a = xt(e, s, "screen");
    if (a)
      return o == null || o.push({ ruleId: "blueprint.dsl", level: "warn", path: "screen", message: `Ignored the screen's deviation[${i}] — ${a}` }), [];
    const { ruleId: l, why: c } = s;
    return [{ ruleId: l, why: c }];
  }) : (o == null || o.push({ ruleId: "blueprint.dsl", level: "warn", path: "screen", message: `Ignored the screen's "deviation" — it is a list.` }), []);
}
function Ac(t, e, n, o, r) {
  if (t === void 0) return;
  if (o.mode !== "exploratory") {
    r.push({ ruleId: "blueprint.dsl", level: "warn", path: n, message: `Removed "deviation" from <${e}> — a Faithful screen keeps every pattern.` });
    return;
  }
  const s = xt(o.manifest, t);
  if (s) {
    r.push({ ruleId: "blueprint.dsl", level: "warn", path: n, message: `Ignored the deviation on <${e}> — ${s}` });
    return;
  }
  const { ruleId: i, why: a } = t;
  return { ruleId: i, why: a };
}
function Qo(t, e = Ce) {
  var f;
  const n = [];
  if (!G(t))
    return { ok: !1, error: "Blueprint payload is not an object.", issues: n };
  const o = t;
  if (o.version !== Ko)
    return {
      ok: !1,
      error: `Unsupported blueprint version: ${JSON.stringify(o.version)} (expected ${Ko}).`,
      issues: n
    };
  if (!G(o.root))
    return { ok: !1, error: "Blueprint has no root node.", issues: n };
  for (const h of Object.keys(t))
    kr.includes(h) || n.push({ ruleId: "blueprint.dsl", level: "info", path: "document", message: `Ignored "${h}" — ${zt(h)}.` });
  const r = ze(e);
  if (!r)
    return { ok: !1, error: "The active design system has no container component.", issues: n };
  const s = Ar(o), i = {
    // An Exploratory screen knows the vocabulary (primitives, Proposal); a Faithful one drops them as unknown.
    manifest: s === "exploratory" ? $t(e) : e,
    schemas: Rs(e, s),
    rootType: r,
    mode: s
  }, a = new Map(Qs(o.screen, e, s).map((h) => [h.ruleId, h.why]));
  let l = ti(o.root, "root", 0, i, n, a);
  if (!l)
    return { ok: !1, error: "The root node could not be interpreted.", issues: n };
  const c = i.manifest.components[l.type];
  if (!(c != null && c.acceptsChildren)) {
    n.push({
      ruleId: "frame.layout",
      level: "info",
      path: "root",
      message: `Wrapped <${l.type}> in a ${i.rootType} — the top level must be a layout container.`
    });
    const h = i.manifest.components[i.rootType];
    l = Ys(i.rootType, js(h, i.schemas[i.rootType]), [l]);
  }
  const d = jc(o.screen, i.manifest, n, s), u = d ? (f = $e(U(i.manifest), d)) == null ? void 0 : f.side : void 0, y = Gn(a, l.deviation);
  if (Lc(l, i.manifest, n, u, y), Xo(
    "level.root-direction",
    y,
    l,
    n,
    "the root layout",
    (h, m) => Ec(h, i.manifest, d, m)
  ), Xo("level.initial-focus", y, l, n, "where focus starts", (h, m) => {
    Oc(h, i.manifest, d, m), Cc(h, i.manifest, d, m);
  }), Nc(l, i.manifest, n), d) {
    l.screen = d;
    const h = Yr(i.manifest, l), m = Jt(i.manifest, l);
    h !== null && m && (l.props = { ...l.props, [m.prop]: m.clear }, n.push({
      ruleId: "layers.stack",
      level: "info",
      path: "root",
      message: `Set ${m.prop} to "${m.clear}" on the root (was ${ie(h)}) — the content layer is transparent over the video and the overlay.`
    }));
  }
  const p = cs(Ic(l), i.manifest);
  if (s !== "exploratory")
    for (const h of p)
      n.push({ ruleId: h.ruleId, level: "warn", path: "root", message: `Still breaks a layout rule — ${h.message}` });
  else {
    const h = rs(p, So(l, d), i.manifest), m = new Set(h.covered), g = new Set(n.filter((b) => b.level === "info" && b.message.startsWith("Kept ")).map((b) => b.ruleId));
    for (const b of p)
      m.has(b) ? g.has(b.ruleId) || (g.add(b.ruleId), De(n, new Map(So(l, d).map((S) => [S.ruleId, S.why])), b.ruleId, "root", `what breaks "${b.ruleId}"`)) : n.push({ ruleId: b.ruleId, level: "warn", path: "root", message: `Still breaks a layout rule — ${b.message}` });
    for (const b of h.errors.filter((S) => S.kind === "unused-deviation"))
      n.push({ ruleId: b.ruleId, level: "info", path: "root", message: b.message });
    for (const b of es(l))
      n.push({ ruleId: b.ruleId, level: "warn", path: "root", message: `Over the primitive budget, reported, not repaired — ${b.message}` });
  }
  return { ok: !0, tree: l, issues: n, nodeCount: Ks(l), mode: s };
}
function ei(t, e = Ce) {
  var y;
  const n = [];
  if (!G(t)) return { ok: !1, error: "Blueprint payload is not an object.", issues: n };
  const o = Qo({ version: t.version, screen: t.screen, mode: t.mode, root: t.root }, e);
  if (!o.ok) return o;
  n.push(...o.issues);
  const r = /* @__PURE__ */ new Set(), s = (p, f) => {
    let h = typeof p == "string" && p.trim() ? p.trim() : `screen-${f + 1}`;
    if (r.has(h)) {
      const m = h;
      h = `screen-${f + 1}`, n.push({ ruleId: "blueprint.dsl", level: "warn", path: `screens[${f}]`, message: `Renamed the screen "${m}" to "${h}" — ids are unique.` });
    }
    return r.add(h), h;
  }, i = (p, f) => typeof p == "string" && p.trim() ? p.trim() : `Screen ${f + 1}`, a = [
    { id: s(t.id, 0), name: i(t.name, 0), tree: o.tree, mode: o.mode }
  ];
  let l = o.nodeCount;
  const c = Array.isArray(t.screens) ? t.screens : [];
  t.screens !== void 0 && !Array.isArray(t.screens) && n.push({ ruleId: "blueprint.dsl", level: "warn", path: "screens", message: 'Ignored "screens" — it is a list of screens.' }), c.forEach((p, f) => {
    const h = `screens[${f}]`;
    if (a.length >= Se) {
      n.push({ ruleId: "blueprint.dsl", level: "warn", path: h, message: `Dropped a screen — a document carries at most ${Se}.` });
      return;
    }
    if (!G(p)) {
      n.push({ ruleId: "blueprint.dsl", level: "warn", path: h, message: "Dropped a screen that was not an object." });
      return;
    }
    for (const S of Object.keys(p))
      xr.includes(S) || n.push({ ruleId: "blueprint.dsl", level: "info", path: h, message: `Ignored "${S}" on a screen — the Blueprint DSL has no such key.` });
    const m = Qo({ version: 1, screen: p.screen, mode: p.mode, root: p.root }, e);
    if (!m.ok) {
      n.push({ level: "warn", path: h, message: `Dropped a screen — ${m.error}` });
      return;
    }
    const g = a.length, b = s(p.id, g);
    n.push(...m.issues.map((S) => ({ ...S, path: `screen "${b}" › ${S.path}` }))), a.push({ id: b, name: i(p.name, g), tree: m.tree, mode: m.mode }), l += m.nodeCount;
  });
  let d = 0;
  for (const p of a) {
    const f = (m, g, b, S) => {
      delete m.goTo, n.push({ ruleId: S, level: "warn", path: `screen "${p.id}" › ${g}`, message: `Dropped the link on <${m.type}> — ${b}.` });
    }, h = (m, g, b) => {
      var R, _, W, z;
      const S = Gn(b, m.deviation);
      if (m.goTo !== void 0) {
        const L = a.find((N) => N.id === m.goTo);
        if (!L) f(m, g, `"${m.goTo}" is not a screen of this document`, "blueprint.dsl");
        else if (L.id === p.id) f(m, g, "it links the screen to itself", "blueprint.dsl");
        else {
          const N = Cs((R = p.tree.screen) == null ? void 0 : R.level, (_ = L.tree.screen) == null ? void 0 : _.level), H = N ? null : Ns(e, m.type, (W = p.tree.screen) == null ? void 0 : W.level, (z = L.tree.screen) == null ? void 0 : z.level), Ne = N ? "flow.next-level" : H ? "flow.link-roles" : null;
          Ne && S.has(Ne) ? (De(n, S, Ne, `screen "${p.id}" › ${g}`, `the link on <${m.type}>`), d += 1) : N ? f(m, g, N, "flow.next-level") : H ? f(m, g, H, "flow.link-roles") : d += 1;
        }
      }
      m.children.forEach((L, N) => h(L, `${g} › ${L.type}[${N}]`, S));
    };
    h(p.tree, "root", new Map((((y = p.tree.screen) == null ? void 0 : y.deviation) ?? []).map((m) => [m.ruleId, m.why])));
  }
  const u = (Array.isArray(t.notes) ? t.notes : []).filter((p) => typeof p == "string" && p.trim().length > 0).map((p) => p.trim().slice(0, sn)).slice(0, dt);
  return { ok: !0, screens: a, issues: n, nodeCount: l, linkCount: d, notes: u };
}
function Ic(t) {
  const e = (n) => ({
    type: n.type,
    props: n.props,
    ...n.children.length ? { children: n.children.map(e) } : {},
    ...n.anchor ? { anchor: !0 } : {},
    ...n.goTo ? { goTo: n.goTo } : {},
    ...n.deviation ? { deviation: n.deviation } : {},
    ...n.reuse ? { reuse: n.reuse } : {}
  });
  return { version: 1, ...t.screen ? { screen: t.screen } : {}, root: e(t) };
}
function Ec(t, e, n, o) {
  const r = U(e), s = n ? $e(r, n) : void 0, i = s ? r.levels.find((u) => u.level === s.level) : void 0, a = e.components[t.type];
  if (!(i != null && i.rootEnd || i != null && i.rootColumn) || !a) return;
  const l = qn(a);
  if (l && t.props[l.prop.name] !== void 0 && t.props[l.prop.name] !== l.column)
    if (i.maxModules === 1) {
      const u = t.children.filter((h) => !h.anchor), y = t.children.filter((h) => h.anchor), p = St(a), f = Ys(t.type, { ...t.props, ...p ? { [p.name]: "end" } : {} }, u);
      t.children = [f, ...y], t.props = { ...t.props, [l.prop.name]: l.column, ...p ? { [p.name]: "stretch" } : {} }, o.push({
        ruleId: "level.root-direction",
        level: "info",
        path: "root",
        message: `Made the root a column and moved its content into a row inside it — on level ${i.level} the stack is a column at the end of the frame.`
      });
    } else
      t.props = { ...t.props, [l.prop.name]: l.column }, o.push({
        ruleId: "level.root-direction",
        level: "info",
        path: "root",
        message: `Made the root a column, keeping its children stacked in order — on level ${i.level} the outermost container must be a column.`
      });
  if (!i.rootEnd) return;
  const c = ls(a), d = s != null && s.allowsRootStart ? "start" : "end";
  !c || t.props[c.name] === d || (o.push({
    ruleId: "level.root-direction",
    level: "info",
    path: "root",
    message: `Set ${c.name} to "${d}" on the root (was ${ie(t.props[c.name])}) — the stack on ${d === "end" ? `level ${i.level}` : "this screen"} sits at the ${d} of the frame.`
  }), t.props = { ...t.props, [c.name]: d });
}
function Oc(t, e, n, o) {
  var y;
  const r = U(e), s = n ? $e(r, n) : void 0, i = s ? (y = r.levels.find((p) => p.level === s.level)) == null ? void 0 : y.initialFocus : void 0;
  if (!i) return;
  const a = [], l = (p) => {
    a.push(p), p.children.forEach(l);
  };
  l(t);
  const c = (p) => {
    const f = e.components[p.type];
    if (!f || !i.on.includes(p.type)) return !1;
    const h = vt(p, f);
    return !!h && (i.value === void 0 || p.props[h.name] === i.value);
  }, d = a.filter((p) => i.on.includes(p.type) && e.components[p.type]);
  if (d.length === 0) return;
  const u = d.find(c) ?? d[0];
  for (const p of a) {
    const f = e.components[p.type], h = f ? vt(p, f) : void 0;
    if (!h || p === u) continue;
    const m = Tt(h);
    p.props = { ...p.props, [h.name]: m }, o.push({
      ruleId: "level.initial-focus",
      level: "warn",
      path: "root",
      message: `Set ${h.name} to "${m}" on <${p.type}> — ${i.hint}`
    });
  }
  if (!c(u)) {
    const p = e.components[u.type], f = Vn(p).find((m) => {
      var g;
      return i.value === void 0 ? (g = m.options) == null ? void 0 : g.includes("focus") : !0;
    });
    if (!f) return;
    const h = i.value ?? "focus";
    u.props = { ...u.props, [f.name]: h }, o.push({
      ruleId: "level.initial-focus",
      level: "warn",
      path: "root",
      message: `Set ${f.name} to "${h}" on <${u.type}> — ${i.hint}`
    });
  }
}
function Cc(t, e, n, o) {
  var l;
  const r = U(e);
  if (!n || ((l = $e(r, n)) == null ? void 0 : l.level) !== 1 || !r.menu) return;
  const s = Xr(e, t);
  if (!s || s.allowed.includes(String(s.found)) || s.allowed.length !== 1) return;
  const i = s.menu, a = s.allowed[0];
  i.props = { ...i.props, [r.menu.prop]: a }, o.push({
    ruleId: "level.initial-focus",
    level: "warn",
    path: "root",
    message: `Set ${r.menu.prop} to "${a}" on <${i.type}> — when Home opens, the focus is on the program button.`
  });
}
function Nc(t, e, n) {
  let o = null;
  const r = (s) => {
    const i = e.components[s.type], a = i ? vt(s, i) : void 0;
    if (a)
      if (!o)
        o = s;
      else {
        const l = Tt(a);
        s.props = { ...s.props, [a.name]: l }, n.push({
          ruleId: "focus.single",
          level: "warn",
          path: "root",
          message: `Set ${a.name} to "${l}" on <${s.type}> — a TV screen focuses one element, and <${o.type}> already has it.`
        });
      }
    s.children.forEach(r);
  };
  r(t);
}
function jc(t, e, n, o) {
  var d, u;
  const r = U(e), s = Ba(r);
  if (!s) return;
  const i = Qs(t, e, o, n), a = (y) => i.length > 0 ? { ...y, deviation: i } : y, l = s;
  if (G(t) && t.shades !== void 0 && o !== "exploratory" && n.push({ ruleId: "blueprint.dsl", level: "warn", path: "screen", message: 'Removed "shades" from the screen — a Faithful screen uses one of the layer models.' }), o === "exploratory" && G(t) && t.model === we) {
    const y = i.some((h) => h.ruleId === "layers.overlay-model"), p = Mn(r, t);
    if (y && !p)
      return n.push({ ruleId: "layers.overlay-model", level: "info", path: "screen", message: `Kept the composed overlay (${t.shades.join(" + ")}) — the screen declares a deviation from "layers.overlay-model".` }), a({ model: we, level: t.level, shades: [...t.shades] });
    const f = ((d = Ke(r, l.model)) == null ? void 0 : d.name) ?? l.model;
    return n.push({
      ruleId: "layers.overlay-model",
      level: "warn",
      path: "screen",
      message: `Replaced the composed overlay with ${f} (level ${l.level}) — ${p ?? 'the screen does not declare a deviation from "layers.overlay-model"'}`
    }), a(l);
  }
  const c = G(t) ? Ke(r, t.model) : void 0;
  if (!c) {
    const y = ((u = Ke(r, l.model)) == null ? void 0 : u.name) ?? l.model;
    return n.push({
      ruleId: "layers.overlay-model",
      level: "warn",
      path: "screen",
      message: t === void 0 ? `The screen named no layer model — used ${y} (level ${l.level}).` : `Unknown layer model ${ie(G(t) ? t.model : t)} — used ${y} (level ${l.level}).`
    }), a(l);
  }
  return G(t) && t.level !== c.level && n.push({
    ruleId: "layers.overlay-model",
    level: "info",
    path: "screen",
    message: `Set the level to ${c.level} — ${c.name} is a level ${c.level} screen (was ${ie(t.level)}).`
  }), a({ model: c.id, level: c.level });
}
function ti(t, e, n, o, r, s) {
  if (!G(t))
    return r.push({ ruleId: "blueprint.dsl", level: "warn", path: e, message: "Dropped a node that was not an object." }), null;
  const i = t.type;
  if (typeof i != "string")
    return r.push({ ruleId: "blueprint.dsl", level: "warn", path: e, message: 'Dropped a node with no "type".' }), null;
  const a = o.manifest.components[i];
  if (!a)
    return r.push({ ruleId: "component.api", level: "warn", path: e, message: `Dropped unknown component <${i}>.` }), null;
  const l = _r(o.mode, i);
  for (const g of Object.keys(t))
    !l.includes(g) && g !== D && r.push({ ruleId: "blueprint.dsl", level: "info", path: e, message: `Ignored "${g}" on <${i}> — ${zt(g)}.` });
  o.mode === "exploratory" && i === Ue && (G(t[D]) ? t[D].ruleId : void 0) !== "registry.new-component" && r.push({ ruleId: "registry.new-component", level: "warn", path: e, message: 'Kept <Proposal>, reported, not repaired — a Proposal declares "registry.new-component" (a component the registry lacks).' });
  let c;
  if (o.mode === "exploratory" && yt(i)) {
    const g = Qr(o.manifest, t[We]);
    if (g)
      r.push({ ruleId: "primitives.reuse", level: "warn", path: e, message: `Kept <${i}>, reported, not repaired — ${g}` });
    else {
      const { considered: b, why: S } = t[We];
      c = { considered: b, why: S };
    }
  }
  const d = Ac(t[D], i, e, o, r), u = Gn(s, d);
  let y = t.props;
  if (t.children !== void 0 && !Array.isArray(t.children)) {
    const g = G(t.props) ? t.props : {};
    typeof t.children == "string" && "children" in a.props && g.children === void 0 ? (y = { ...g, children: t.children }, r.push({ ruleId: "component.api", level: "info", path: e, message: `Moved the text in "children" into <${i}>'s children prop.` })) : r.push({ ruleId: "component.api", level: "warn", path: e, message: `Dropped "children" on <${i}> — it is a list of nodes.` });
  }
  const p = Rc(o.manifest, a, o.schemas[i], y, e, r), f = Array.isArray(t.children) ? t.children : [];
  let h = [];
  f.length > 0 && !a.acceptsChildren ? r.push({
    ruleId: "component.api",
    level: "warn",
    path: e,
    message: `<${i}> can't contain children — dropped ${f.length}.`
  }) : a.acceptsChildren && (h = f.map((g, b) => ti(g, `${e} › ${i}[${b}]`, n + 1, o, r, u)).filter((g) => g !== null), h = Mc(i, h, e, o.manifest, r, u));
  const m = { id: Gs(), type: i, props: p, children: h };
  return d && (m.deviation = d), c && (m.reuse = c), typeof t.goTo == "string" && t.goTo.trim() ? m.goTo = t.goTo.trim() : t.goTo !== void 0 && r.push({ ruleId: "blueprint.dsl", level: "warn", path: e, message: `Ignored goTo=${ie(t.goTo)} on <${i}> (must be a screen id).` }), t.anchor === !0 ? n === 1 ? m.anchor = !0 : r.push({
    ruleId: "layout.anchor-structure",
    level: "warn",
    path: e,
    message: `Removed "anchor" from <${i}> — only a direct child of the root can be anchored.`
  }) : t.anchor !== void 0 && t.anchor !== !1 && r.push({
    ruleId: "layout.anchor-structure",
    level: "warn",
    path: e,
    message: `Ignored anchor=${ie(t.anchor)} on <${i}> (must be true or omitted).`
  }), m;
}
function Rc(t, e, n, o, r, s) {
  const i = n.shape, a = G(o) ? o : {}, l = {};
  for (const [u, y] of Object.entries(i)) {
    if (!(u in a)) continue;
    let p = y.safeParse(a[u]);
    const f = e.props[u];
    if (!p.success && (f != null && f.fields) && Array.isArray(a[u])) {
      const h = Pc(t, e, u, f, a[u], r, s), m = y.safeParse(h);
      if (m.success) {
        l[u] = m.data;
        continue;
      }
      p = m;
    }
    p.success ? l[u] = p.data : s.push({
      ruleId: xn(t, e.props[u], a[u]),
      level: "warn",
      path: r,
      message: `Ignored ${u}=${ie(a[u])} on <${e.id}> (not an allowed value) — kept the default.`
    });
  }
  for (const u of Object.keys(a))
    u in i || s.push({
      ruleId: "component.api",
      level: "warn",
      path: r,
      message: `Removed unsupported prop "${u}" from <${e.id}>.`
    });
  const c = { ...js(e, n), ...l }, d = n.safeParse(c);
  return d.success ? d.data : c;
}
function Pc(t, e, n, o, r, s, i) {
  const a = o.fields ?? {}, l = Jn(a, t), c = (u) => {
    i.push({ ruleId: "component.api", level: "warn", path: s, message: u });
  }, d = [];
  return r.forEach((u, y) => {
    const p = `${n}[${y}]`;
    if (!G(u)) {
      c(`Dropped ${p} on <${e.id}> — an item is an object with ${Object.keys(a).join(", ")}.`);
      return;
    }
    const f = { ...u };
    for (const m of Object.keys(f))
      m in a || (delete f[m], c(`Removed unsupported field "${m}" from ${p} on <${e.id}>.`));
    let h = l.safeParse(f);
    if (!h.success) {
      for (const m of new Set(h.error.issues.map((g) => String(g.path[0])))) {
        const g = a[m];
        if (!g || g.required && g.defaultValue === void 0) {
          c(
            `Dropped ${p} on <${e.id}> — "${m}" is required and ${ie(f[m])} is not an allowed value, so there is no default to keep the item by.`
          );
          return;
        }
        c(`Ignored ${p}.${m}=${ie(f[m])} on <${e.id}> (not an allowed value) — kept the default.`), delete f[m];
      }
      if (h = l.safeParse(f), !h.success) {
        c(`Dropped ${p} on <${e.id}> — it is not an allowed item.`);
        return;
      }
    }
    d.push(h.data);
  }), d;
}
function Lc(t, e, n, o, r = Xs) {
  const s = e.components[t.type], i = s ? Oe(s, "margin") : void 0;
  if (i) {
    const u = ue(e, t.props[i.name]), y = Ee(e, Ie(e, i), 0);
    u !== null && u !== 0 && y && (n.push({
      ruleId: "frame.layout",
      level: "info",
      path: "root",
      message: `Set ${i.name} to "${y}" on the root — the frame already applies the ${E.margin}px safe-area margin.`
    }), t.props = { ...t.props, [i.name]: y });
  }
  const a = s ? St(s) : void 0;
  a && t.props[a.name] !== void 0 && t.props[a.name] !== "stretch" && r.has("layout.root-align") ? De(n, r, "layout.root-align", "root", `${a.name} ${ie(t.props[a.name])} on the root`) : a && t.props[a.name] !== void 0 && t.props[a.name] !== "stretch" && (n.push({
    ruleId: "layout.root-align",
    level: "info",
    path: "root",
    message: `Set ${a.name} to "stretch" on the root (was ${ie(t.props[a.name])}) — the stack that holds the components always stretches.`
  }), t.props = { ...t.props, [a.name]: "stretch" });
  const l = o ? wt(e, t) : null;
  for (const u of s ? Fn(s) : []) {
    if (u === a || t.props[u.name] !== "center") continue;
    if (r.has("layout.no-static-center")) {
      De(n, r, "layout.no-static-center", "root", `${u.name} "center" on the root`);
      continue;
    }
    const y = o && (l == null ? void 0 : l.prop) === u.name ? l.values[o] : ss(u);
    n.push({
      ruleId: "layout.no-static-center",
      level: "info",
      path: "root",
      message: `Set ${u.name} to "${y}" on the root — master layouts don't use static center alignment; the anchored group follows the focus instead.`
    }), t.props = { ...t.props, [u.name]: y };
  }
  ni(t, "root", 0, e, n);
  const c = Kr(e);
  for (const u of t.children)
    u.anchor && c.has(u.type) && (delete u.anchor, n.push({
      ruleId: "layout.anchor-structure",
      level: "warn",
      path: "root",
      message: `Un-anchored <${u.type}> — it holds the screen's focus in the content; only a secondary cluster is anchored.`
    }));
  const d = t.children.filter((u) => u.anchor);
  if (d.length > 1 && r.has("layout.anchor")) {
    De(n, r, "layout.anchor", "root", `${d.length} anchored groups`);
    return;
  }
  for (const u of d.slice(0, -1))
    delete u.anchor, n.push({
      ruleId: "layout.anchor",
      level: "warn",
      path: "root",
      message: `Un-anchored an extra <${u.type}> — a frame anchors at most one element group (kept the last).`
    });
}
function ni(t, e, n, o, r) {
  const s = o.components[t.type], i = s != null && s.acceptsChildren ? Oe(s, "gutter") : void 0;
  if (i && as(t, n, o)) {
    const a = ue(o, t.props[i.name]), l = Ee(o, Ie(o, i), E.gutter);
    a !== null && a !== E.gutter && l && (r.push({
      ruleId: "frame.layout",
      level: "info",
      path: e,
      message: `Set ${i.name} to "${l}" on <${t.type}> — stacked modules and columns sit exactly ${E.gutter}px apart.`
    }), t.props = { ...t.props, [i.name]: l });
  }
  t.type === ze(o) && t.children.forEach(
    (a, l) => ni(a, `${e} › ${t.type}[${l}]`, n + 1, o, r)
  );
}
function G(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function ie(t) {
  const e = typeof t == "string" ? `"${t}"` : JSON.stringify(t);
  return e && e.length > 32 ? `${e.slice(0, 32)}…` : String(e);
}
function Mc(t, e, n, o, r, s = Xs) {
  var p;
  const i = (f) => {
    var h;
    return ((h = f == null ? void 0 : f.deviation) == null ? void 0 : h.ruleId) === "layout.slots" ? f.deviation.why : s.get("layout.slots");
  }, a = (f, h) => {
    const m = i(f);
    return m === void 0 ? !1 : (De(r, /* @__PURE__ */ new Map([["layout.slots", m]]), "layout.slots", n, h), !0);
  }, l = e.filter((f) => {
    const h = jr(o, t, f.type);
    return h && a(f, `<${f.type}> inside <${t}>`) ? !0 : (h && r.push({ ruleId: "layout.slots", level: "warn", path: n, message: `Dropped a child — ${h}` }), !h);
  }), c = (p = o.components[t]) == null ? void 0 : p.slots;
  if (!c) return l;
  const d = /* @__PURE__ */ new Set(), u = l.filter((f) => d.has(f.type) ? a(f, `a second <${f.type}> in <${t}>`) ? !0 : (r.push({ ruleId: "layout.slots", level: "warn", path: n, message: `Dropped a second <${f.type}> — <${t}> takes at most one.` }), !1) : (d.add(f.type), !0)), y = [...u].sort((f, h) => c.indexOf(f.type) - c.indexOf(h.type));
  if (y.some((f, h) => f !== u[h])) {
    if (a(void 0, `<${t}>'s children in the order written`)) return u;
    r.push({ ruleId: "layout.slots", level: "warn", path: n, message: `Put <${t}>'s children back in the order ${c.join(", ")}.` });
  }
  return y;
}
function Yn(t, e) {
  const n = (o) => (t == null ? void 0 : t[o]) === void 0 && (e == null ? void 0 : e[o]) === void 0 ? {} : { [o]: ((t == null ? void 0 : t[o]) ?? 0) + ((e == null ? void 0 : e[o]) ?? 0) };
  return {
    inputTokens: ((t == null ? void 0 : t.inputTokens) ?? 0) + ((e == null ? void 0 : e.inputTokens) ?? 0),
    outputTokens: ((t == null ? void 0 : t.outputTokens) ?? 0) + ((e == null ? void 0 : e.outputTokens) ?? 0),
    costUsd: ((t == null ? void 0 : t.costUsd) ?? 0) + ((e == null ? void 0 : e.costUsd) ?? 0),
    costEstimated: !!(t != null && t.costEstimated) || !!(e != null && e.costEstimated),
    ...n("cacheReadTokens"),
    ...n("cacheWriteTokens")
  };
}
class Sn extends Error {
  constructor(e, n) {
    super(e), this.raw = n, this.name = "MalformedOutputError";
  }
}
function oi(t) {
  let e = t.trim();
  const n = e.match(/```(?:json)?\s*([\s\S]*?)```/i);
  n && (e = n[1].trim());
  try {
    return JSON.parse(e);
  } catch {
  }
  const o = e.indexOf("{"), r = e.lastIndexOf("}");
  if (o >= 0 && r > o)
    try {
      return JSON.parse(e.slice(o, r + 1));
    } catch (s) {
      throw new Sn(s instanceof Error ? s.message : String(s), t);
    }
  throw new Sn("Model output did not contain a JSON object", t);
}
function Kn(t) {
  return t && typeof t == "object" && "blueprint" in t ? t.blueprint : t;
}
const Bc = /* @__PURE__ */ new Set(["", "your-api-key", "sk-ant-xxx", "changeme"]);
function Dc() {
  var e;
  const t = (e = process.env.ANTHROPIC_API_KEY) == null ? void 0 : e.trim();
  return !!t && !Bc.has(t);
}
var yr;
const Fc = (yr = process.env.AI_GENERATOR_MODEL) == null ? void 0 : yr.trim();
var gr;
const Vc = (gr = process.env.AI_EFFORT) == null ? void 0 : gr.trim(), ri = (t, e) => ({
  name: ct,
  description: `Render a UI onto the ScreenFlow Studio canvas. Call this exactly once with the complete Blueprint tree. The root node must be a ${e}.`,
  input_schema: {
    type: "object",
    properties: {
      blueprint: {
        type: "object",
        properties: {
          version: { type: "integer", enum: [1] },
          screen: {
            type: "object",
            description: "The layer rule (Camadas): the layer model whose shades the engine paints between the video and this content, and its navigation level. Both come from the system prompt.",
            properties: {
              model: { type: "string" },
              level: { type: "integer", enum: [0, 1, 2, 3] }
            },
            required: ["model", "level"]
          },
          id: { type: "string", description: "The first screen's id — only when another screen links back to it." },
          name: { type: "string", description: "Short label of the first screen." },
          notes: {
            type: "array",
            description: "Up to 4 short notes for the user, in their language: what you approximated because the registry lacks it, or which law overrode part of their request (e.g. focus placement). Omit when there is nothing to say.",
            items: { type: "string" }
          },
          screens: {
            type: "array",
            description: "Every further screen: the other options when the user asks for several versions, or the next steps of a clickable flow (link them with `goTo`). Each: { id, name?, screen, root } — `root` shaped like the top-level root.",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                screen: { type: "object" },
                root: { type: "object" }
              },
              required: ["id", "screen", "root"]
            }
          },
          root: {
            type: "object",
            description: `A component node: { type, props?, children?, anchor?, goTo? }. \`goTo\` is a screen id — the screen a click on this node opens. \`children\` is only valid on a component the system prompt lists as accepting children. \`anchor: true\` marks the one element group, a direct child of the root, that the canvas pins to the side the TV focus is on. The root must be a ${e}.`,
            properties: {
              type: { type: "string", enum: [...t] },
              props: { type: "object" },
              children: { type: "array", items: { type: "object" } },
              goTo: { type: "string" }
            },
            required: ["type"]
          }
        },
        required: ["version", "screen", "root"]
      }
    },
    required: ["blueprint"]
  }
}), er = ri(Zn, "Stack");
function qc(t) {
  if (!t) return er;
  const e = Object.keys(t.components), n = ze(t) ?? "Stack";
  return n === "Stack" && e.join() === Zn.join() ? er : ri(e, n);
}
const tr = {
  type: "object",
  properties: {
    ruleId: { type: "string", description: "The id of the pattern rule that is broken." },
    why: { type: "string", description: "One short sentence: why this pattern is broken here." }
  },
  required: ["ruleId", "why"]
};
function Uc(t = "faithful", e) {
  const n = qc(e);
  if (t !== "exploratory") return n;
  const o = structuredClone(n), r = o.input_schema.properties.blueprint.properties;
  return r.screen.properties.deviation = {
    type: "array",
    description: "Patterns the screen as a whole breaks, when no single node carries the break. Exploratory mode only.",
    items: tr
  }, r.root.description += " In Exploratory mode a node may also carry `deviation: { ruleId, why }` — a pattern rule it breaks, declared at the node where it happens. A node may also be a primitive (`primitive:Box`, `primitive:Stack`, `primitive:Text`), which must carry `reuse: { considered, why }`, or a `Proposal` (props `description` and `proposedApi`, declaring `registry.new-component`) — only when no registry component expresses the need.", r.root.properties.deviation = tr, r.root.properties.reuse = {
    type: "object",
    description: "On a primitive only: the registry components considered (by id, comma-separated) and why none of them does it.",
    properties: { considered: { type: "string" }, why: { type: "string" } },
    required: ["considered", "why"]
  }, r.screen.properties.shades = {
    type: "array",
    description: 'With model "composed" only: the shade pieces of a composed overlay, each once (declare layers.overlay-model on the screen).',
    items: { type: "string" }
  }, o;
}
function nr(t) {
  return {
    model: t.model || Fc || ia,
    effort: t.effort || Vc || la
  };
}
function or(t) {
  return t.map((e) => ({ role: e.role, content: e.content }));
}
function rr(t, e) {
  return {
    inputTokens: e.input_tokens,
    outputTokens: e.output_tokens,
    costUsd: ha(t, e.input_tokens, e.output_tokens, {
      readTokens: e.cache_read_input_tokens ?? void 0,
      writeTokens: e.cache_creation_input_tokens ?? void 0
    }),
    costEstimated: !0,
    cacheReadTokens: e.cache_read_input_tokens ?? void 0,
    cacheWriteTokens: e.cache_creation_input_tokens ?? void 0
  };
}
const Zc = {
  id: "api-key",
  label: "Anthropic API key",
  isAvailable: async () => Dc(),
  async complete(t) {
    const e = new to(), { model: n, effort: o } = nr(t), r = await e.messages.create({
      model: n,
      max_tokens: 8e3,
      system: t.system,
      output_config: { effort: o },
      messages: or(t.messages)
    });
    return { text: r.content.filter((i) => i.type === "text").map((i) => i.text).join(`
`).trim(), model: n, usage: rr(n, r.usage) };
  },
  async renderUi(t) {
    const e = new to(), { model: n, effort: o } = nr(t), r = await e.messages.create({
      model: n,
      max_tokens: 16e3,
      system: t.system,
      output_config: { effort: o },
      tools: [Uc(t.mode, t.manifest)],
      tool_choice: { type: "tool", name: ct },
      messages: or(t.messages)
    }), s = r.content.find(
      (i) => i.type === "tool_use" && i.name === ct
    );
    if (!s)
      throw new Error(`Model did not call ${ct} (stop_reason: ${r.stop_reason})`);
    return {
      blueprint: Kn(s.input),
      model: n,
      usage: rr(n, r.usage)
    };
  }
}, si = Si(_i), zc = 12e4;
function Hc(t) {
  const e = B.join(t, ".nvm", "versions", "node");
  try {
    return Ai(e).map((n) => B.join(e, n, "bin", "claude")).filter(wr);
  } catch {
    return [];
  }
}
function Jc() {
  const t = $r.homedir();
  return [
    process.env.CLAUDE_CLI_PATH,
    "claude",
    // PATH
    B.join(t, ".claude", "local", "claude"),
    B.join(t, ".local", "bin", "claude"),
    B.join(t, ".bun", "bin", "claude"),
    "/opt/homebrew/bin/claude",
    "/usr/local/bin/claude",
    B.join(t, ".npm-global", "bin", "claude"),
    B.join(t, ".volta", "bin", "claude"),
    ...Hc(t)
  ].filter((e) => !!e);
}
let Ct;
async function ii() {
  if (Ct !== void 0) return Ct;
  for (const t of Jc())
    if (!(t.includes(B.sep) && !wr(t)))
      try {
        return await si(t, ["--version"], { timeout: 5e3 }), Ct = t, t;
      } catch {
      }
  return Ct = null, null;
}
function Wc(t) {
  var s;
  const e = t.filter((i) => i.content.trim().length > 0);
  if (e.length <= 1) return ((s = e[0]) == null ? void 0 : s.content) ?? "";
  const n = e.slice(0, -1), o = e[e.length - 1];
  return `Conversation so far:
${n.map((i) => `${i.role === "user" ? "User" : "You"}: ${i.content}`).join(`
`)}

Now: ${o.content}`;
}
const Gc = "This is a design task, not a coding task: answer from this prompt alone, without tools and without reading or writing files.", Tn = () => {
  var t;
  return ((t = process.env.SFS_CLI_ISOLATE) == null ? void 0 : t.trim()) !== "0";
}, Yc = [
  "--tools",
  "",
  "--disable-slash-commands",
  "--strict-mcp-config",
  "--setting-sources",
  "",
  "--safe-mode",
  "--no-session-persistence"
];
function Kc() {
  const t = B.join($r.tmpdir(), "sfs-cli-clean");
  return Ti(t, { recursive: !0 }), t;
}
function Xc(t, e, n, o) {
  const r = ["-p", t, "--output-format", "json", "--system-prompt", e];
  return n && r.push("--model", n), o && r.push("--effort", o), Tn() && r.push(...Yc), r;
}
async function sr(t) {
  var l, c, d, u, y, p;
  const e = await ii();
  if (!e)
    throw new Error(
      "The `claude` CLI was not found. Install Claude Code and sign in, or set CLAUDE_CLI_PATH."
    );
  const n = t.model || ((l = process.env.AI_CLI_MODEL) == null ? void 0 : l.trim()) || void 0, o = t.effort || ((c = process.env.AI_EFFORT) == null ? void 0 : c.trim()) || void 0, r = Tn() ? t.system : `${Gc}

${t.system}`, s = Xc(Wc(t.messages), r, n, o);
  let i;
  try {
    ({ stdout: i } = await si(e, s, {
      timeout: zc,
      maxBuffer: 10 * 1024 * 1024,
      ...Tn() ? { cwd: Kc() } : {}
    }));
  } catch (f) {
    const h = f instanceof Error ? f.message : String(f);
    throw /not logged in|authenticate|unauthor/i.test(h) ? new Error("Claude Code is not signed in — run `claude` once and log in.") : new Error(`claude CLI failed: ${h}`);
  }
  let a;
  try {
    a = JSON.parse(i);
  } catch {
    throw new Error("Could not parse the claude CLI JSON output");
  }
  if (a.is_error || typeof a.result != "string")
    throw new Error(`claude CLI returned an error (${a.subtype ?? "unknown"})`);
  return {
    text: a.result,
    model: n,
    usage: {
      inputTokens: (d = a.usage) == null ? void 0 : d.input_tokens,
      outputTokens: (u = a.usage) == null ? void 0 : u.output_tokens,
      costUsd: typeof a.total_cost_usd == "number" ? a.total_cost_usd : void 0,
      costEstimated: !1,
      cacheReadTokens: (y = a.usage) == null ? void 0 : y.cache_read_input_tokens,
      cacheWriteTokens: (p = a.usage) == null ? void 0 : p.cache_creation_input_tokens
    }
  };
}
const Qc = {
  id: "claude-cli",
  label: "Claude Code (your subscription)",
  isAvailable: async () => await ii() !== null,
  complete: sr,
  async renderUi(t) {
    const { text: e, model: n, usage: o } = await sr(t);
    return { blueprint: Kn(oi(e)), model: n, usage: o };
  }
}, ir = [Qc, Zc], ed = ["claude-cli", "api-key"];
function ai() {
  var e;
  const t = (e = process.env.AI_PROVIDER) == null ? void 0 : e.trim().toLowerCase();
  return t === "api-key" || t === "claude-cli" ? t : "auto";
}
async function li() {
  const t = ai();
  if (t !== "auto") {
    const e = ir.find((n) => n.id === t);
    return e && await e.isAvailable() ? e : null;
  }
  for (const e of ed) {
    const n = ir.find((o) => o.id === e);
    if (n && await n.isAvailable()) return n;
  }
  return null;
}
async function td() {
  const t = ai(), e = await li();
  return e ? `${e.label} (AI_PROVIDER=${t})` : `no provider available (AI_PROVIDER=${t}) — serving the built-in fixture`;
}
const nd = "Esse pedido foge dos padrões do design system, você deseja prosseguir";
function ci(t) {
  return t.exploration.length > 0 || t.unknown.length > 0;
}
function od(t, e, n) {
  var d;
  const o = [];
  let r = !1;
  for (const u of e.conflicts) {
    const y = gt(n, u.ruleId);
    y ? o.push({ rule: y, why: u.why }) : r = !0;
  }
  const s = (u) => o.filter((y) => y.rule.flexibility === u), i = s("law"), a = s("pattern"), l = s("convention").map(({ rule: u, why: y }) => `Convention noted: "${u.title}"${y ? ` — ${y}` : ""}.`);
  if (i.length > 0)
    return {
      kind: "ask",
      question: {
        kind: "law",
        text: `Esse pedido esbarra em ${i.length === 1 ? "uma lei" : "leis"} do design system, que vale${i.length === 1 ? "" : "m"} nos dois modos: ${i.map((u) => `"${u.rule.title}"`).join(", ")}.`,
        why: (d = i.find((u) => u.why)) == null ? void 0 : d.why,
        rules: i.map(({ rule: u }) => ui(u)),
        choices: ["faithful"],
        faithfulAlternative: e.faithfulAlternative
      }
    };
  const c = ci(t);
  return !r && a.length > 0 && c ? { kind: "go", mode: "exploratory", notices: l, ...e.faithfulAlternative ? { faithfulAlternative: e.faithfulAlternative } : {} } : r || a.length > 0 || c ? { kind: "ask", question: di(a, e.faithfulAlternative) } : { kind: "go", mode: "faithful", notices: l };
}
function di(t, e) {
  var n;
  return {
    kind: "conflict",
    text: nd,
    why: (n = t.find((o) => o.why)) == null ? void 0 : n.why,
    rules: t.map(({ rule: o }) => ui(o)),
    // Three buttons: follow the patterns, explore beyond them, or both side by side (9F). A law question offers none of
    // the last two: the law holds in both modes, so the two screens would be the same.
    choices: ["faithful", "exploratory", "both"],
    faithfulAlternative: e
  };
}
function rd(t, e) {
  if (t.unknown.length === 0) return [];
  const n = gt(e, "component.api");
  return [
    `${e.name} has no ${t.unknown.join(", ")}; the screen approximates ${t.unknown.length === 1 ? "it" : "them"} with its own components${n ? ` (law: "${n.title}")` : ""}.`
  ];
}
function ui(t) {
  return { id: t.id, title: t.title, flexibility: t.flexibility };
}
const sd = [
  {
    request: "Home com uma notificação sobre a votação ao vivo",
    reply: {
      summary: "Home com uma notificação é um modelo de camada que já existe, com componentes do catálogo. Nada sai do padrão.",
      mode: "faithful",
      conflicts: []
    }
  },
  {
    request: "E se o rodapé do card de conteúdo viesse antes do cabeçalho?",
    reply: {
      summary: 'Pede para trocar a ordem das zonas do card de conteúdo. A ordem dos slots é um padrão, e o pedido pergunta "e se".',
      mode: "exploratory",
      conflicts: [{ ruleId: "layout.slots", why: "o rodapé viria antes do cabeçalho, fora da ordem das zonas" }],
      faithfulAlternative: "Card de conteúdo com cabeçalho, corpo e rodapé, na ordem do padrão."
    }
  },
  {
    request: "Use o vermelho #ff0000 no título da notificação",
    reply: {
      summary: "Pede um hex cru. Só tokens podem ser usados, em qualquer modo.",
      mode: "faithful",
      conflicts: [{ ruleId: "tokens.only", why: "#ff0000 é um valor cru, não um token" }],
      faithfulAlternative: "Notificação com o título na cor de destaque do design system."
    }
  },
  {
    request: "Quatro cards de interatividade lado a lado numa tela de nível 3",
    reply: {
      summary: "O nível 3 mostra um único módulo; quatro cards lado a lado passam desse limite. O limite de módulos por nível é um padrão.",
      mode: "exploratory",
      conflicts: [{ ruleId: "level.module-limit", why: "quatro módulos numa tela de nível 3, que mostra um só" }],
      faithfulAlternative: "Uma tela de nível 3 com uma interatividade só, e o trilho de quatro cards no nível 2."
    }
  },
  {
    request: "Um botão largo escrito OK que abre as estatísticas",
    reply: {
      summary: 'O rótulo "OK" não diz o que o botão faz. É uma convenção: só gera uma nota.',
      mode: "faithful",
      conflicts: [{ ruleId: "copy.button-label", why: '"OK" não diz que o botão abre as estatísticas' }],
      faithfulAlternative: 'Um botão largo escrito "Ver estatísticas".'
    }
  },
  {
    request: "Explore um layout com o menu principal no topo da tela",
    reply: {
      summary: "Nenhum modelo de camada sombreia o topo para o menu principal; o menu fica na base. Pede para explorar.",
      mode: "exploratory",
      conflicts: [{ ruleId: "layers.overlay-model", why: "nenhum modelo de camada põe o menu no topo" }],
      faithfulAlternative: "Home com o menu principal na base da tela."
    }
  }
], id = I({
  summary: w(),
  mode: w(),
  conflicts: q(I({ ruleId: w(), why: w().optional() })).max(24),
  faithfulAlternative: w().nullish()
}), ad = "The mode check could not read its own answer, so this screen was generated in Faithful mode.";
function ld(t) {
  const e = kt(t).map((o) => `- ${o.id} — ${o.flexibility} — ${o.title}: ${o.statement}`).join(`
`), n = sd.map(
    ({ request: o, reply: r }) => `Request: ${o}
Answer: ${JSON.stringify({ faithfulAlternative: null, ...r })}`
  ).join(`

`);
  return `You are the ROUTER of ScreenFlow Studio. Before a screen is planned, you read the
request and list the rules of ${t.name} it would break if it were built exactly as
asked. You do not design the screen.

# Rules book (id — level — title: statement)

${e}

A law holds in every mode. A pattern may be broken only in the exploratory mode. A
convention only gets a note.

# Answer

ONE JSON object and nothing else:
{"summary": "…", "mode": "faithful" | "exploratory", "conflicts": [{"ruleId": "…", "why": "…"}], "faithfulAlternative": "…" | null}
- "summary": one short sentence — what the request asks, and which rules it touches.
- "conflicts": only the rules the request would break as asked, by their exact id from the book. Empty when it fits.
- "why": one short line, in the language of the request.
- "faithfulAlternative": when there is a conflict, the request rewritten to stay inside every rule, in the language of the request; otherwise null.

# Examples

${n}`;
}
async function cd(t, e, n, o) {
  const r = Hn(e, n), s = [
    `step 0 · router signals: ${[...r.exploration.map((d) => `"${d}"`), ...r.unknown.map((d) => `no ${d}`)].join(", ") || "none"}`
  ], i = ld(n), a = [{ role: "user", content: e }];
  let l;
  for (let d = 1; d <= 2; d++) {
    const u = await t.complete({ system: i, messages: a, model: o, effort: "low" });
    l = Yn(l, u.usage);
    const y = dd(u.text);
    if (y) {
      const p = od(r, y, n), f = y.conflicts.map((h) => h.ruleId).join(", ") || "none";
      return s.push(`step 0 · router: conflicts ${f} → ${p.kind === "go" ? p.mode : `ask (${p.question.kind})`}`), { decision: p, usage: l, steps: s, reply: y, raw: u.text };
    }
    s.push(`step 0 · router: unreadable answer on attempt ${d}`), a.push(
      { role: "assistant", content: u.text.slice(0, 2e3) },
      { role: "user", content: "That was not the expected answer. Reply with ONLY the JSON object described in the instructions." }
    );
  }
  return { decision: ci(r) ? { kind: "ask", question: di([]) } : { kind: "go", mode: "faithful", notices: [ad] }, usage: l, steps: s };
}
function dd(t) {
  try {
    const e = id.safeParse(oi(t));
    if (!e.success) return null;
    const { faithfulAlternative: n, ...o } = e.data;
    return n ? { ...o, faithfulAlternative: n } : o;
  } catch {
    return null;
  }
}
let ar;
const ye = pi(Number.parseInt(process.env.AI_MAX_VALIDATION_RETRIES ?? "", 10) || 2, 0, 4);
function ud() {
  const t = Number.parseInt(process.env.AI_MAX_REPLANS ?? "", 10);
  return pi(Number.isNaN(t) ? 1 : t, 0, 2);
}
function hd(t, e) {
  const n = t.filter((r) => r.kind !== void 0);
  return n.length === 0 || e ? null : `${[...new Set(n.map((r) => r.kind))].join(", ")} (${[...new Set(n.map((r) => r.ruleId))].join(", ")}) — persisted after the generator's retries`;
}
function lr(t, e) {
  return e === "exploratory" ? t.map((n) => `[${n.ruleId}] at ${n.path.join(".") || "the document"}: ${n.message}`) : t.map((n) => n.message);
}
const fe = (t) => typeof t == "object" && t !== null && !Array.isArray(t);
function pd(t, e) {
  if (!fe(t)) return [];
  const n = [], o = (r) => {
    r.mode !== void 0 && r.mode !== e && n.push(JSON.stringify(r.mode)), e === "exploratory" ? r.mode = e : delete r.mode;
  };
  return o(t), Array.isArray(t.screens) && t.screens.filter(fe).forEach(o), n;
}
async function fd(t, e = [], n = {}, o = Ce) {
  const r = Date.now(), s = [
    `prompt: ${JSON.stringify(t)}`,
    `design system: ${o.name} v${o.version} (${Object.keys(o.components).length} components)`
  ], i = await li();
  if (!i)
    return s.push("no AI provider available — returning the home template"), {
      ok: !0,
      blueprint: zn.blueprint,
      meta: { source: "dummy", durationMs: Date.now() - r, steps: s }
    };
  let a;
  const l = [];
  let c;
  const d = [];
  try {
    let u = "faithful", y;
    if (n.mode === "auto") {
      const h = await cd(i, t, o, n.model);
      if (a = Yn(a, h.usage), l.push({ step: "router", ...h.usage }), s.push(...h.steps), h.decision.kind === "ask") {
        const { question: m } = h.decision;
        return {
          ok: !1,
          error: m.text,
          stage: "router",
          question: m,
          meta: { source: "llm", provider: i.id, usage: a, durationMs: Date.now() - r, steps: s }
        };
      }
      d.push(...h.decision.notices), u = h.decision.mode, y = h.decision.faithfulAlternative;
    } else n.mode && (s.push(`step 0 · router: explicit ${n.mode}`), d.push(...rd(Hn(t, o), o)), n.mode === "exploratory" && (u = "exploratory"));
    const p = { usage: a, model: c, calls: l }, f = { provider: i, manifest: o, options: n, request: t, steps: s, notices: d, trace: [], acc: p };
    try {
      if (n.mode === "both") {
        const g = await vd(t, e, f);
        return hr(g.blueprint, i, p.model, p.usage, s, r, {
          ...ur(g.mode, d, f.trace),
          ...g.branches > 1 ? { branches: g.branches } : {},
          calls: l
        });
      }
      const h = u === "exploratory" && y ? hi(t, y) : t, m = await In({ ...f, mode: u, plannerMessages: [...e, { role: "user", content: h }] });
      return hr(m.blueprint, i, p.model, p.usage, s, r, { ...ur(u, d, f.trace), calls: l });
    } finally {
      a = p.usage, c = p.model;
    }
  } catch (u) {
    const y = u instanceof Error ? u.message : String(u);
    return s.push(`error: ${y}`), {
      ok: !1,
      error: y,
      stage: `${i.id}:pipeline`,
      meta: {
        source: "llm",
        provider: i.id,
        model: c,
        usage: a,
        durationMs: Date.now() - r,
        steps: s,
        ...l.length > 0 ? { calls: l } : {}
      }
    };
  }
}
function An(t, e, n) {
  t.usage = Yn(t.usage, e), t.calls.push({ ...n, ...e });
}
const md = (t) => `

Original request (the plan is authoritative for what to build; this is also the language for "notes", each "deviation.why" and a Proposal's "description"):
${t}`, hi = (t, e) => `${t}

The same request kept inside the patterns — start from this plan and change only what the request needs to break:
${e}`;
async function In(t) {
  var m;
  const { provider: e, manifest: n, options: o, mode: r, acc: s, notices: i, trace: a } = t, l = (g) => void t.steps.push(t.branch ? `[${t.branch}] ${g}` : g), c = e.id === "api-key" ? "tool" : "json", d = Sc(c, n, r), u = Ws(n, { prompt: String(((m = t.plannerMessages.at(-1)) == null ? void 0 : m.content) ?? ""), mode: r }), y = r === "exploratory" ? ud() : 0;
  let p = t.plannerMessages, f, h = [];
  for (let g = 0; ; g++) {
    let b;
    if (g === 0 && t.firstPlan !== void 0)
      b = t.firstPlan;
    else {
      const N = await e.complete({
        system: u,
        messages: p,
        model: o.model,
        effort: "low"
        // planning is structural — keep it cheap
      });
      An(s, N.usage, { step: "planner", ...t.branch ? { branch: t.branch } : {}, attempt: g }), s.model = N.model, b = N.text;
    }
    const S = b.split(`
`).filter((N) => N.trim().length > 0).length, R = t.template ?? Ts(b, Wn(n));
    l(
      `step 1 · planner: ${S}-line plan` + (R.template ? ` · template: ${R.template.id} (${t.template ? "locked" : R.reason})` : ` · template: ${R.reason}`)
    );
    const W = [{ role: "user", content: `${R.template ? `Start from this screen — it is valid, and it is the shape the plan describes.
Keep its structure and change only what the plan asks for; drop what the plan
does not mention.

TEMPLATE "${R.template.id}" (${R.template.name}):
${JSON.stringify(R.template.blueprint, null, 2)}

` : ""}Build exactly this plan as the Blueprint JSON.

PLAN:
${b}${md(t.request)}` }];
    let z = null, L = [];
    h = [];
    for (let N = 1; N <= ye + 1; N++) {
      let H, Ne = "", Xn = !1;
      try {
        const V = await e.renderUi({ system: d, messages: W, model: o.model, effort: o.effort, mode: r, manifest: n });
        An(s, V.usage, { step: "generator", ...t.branch ? { branch: t.branch } : {}, attempt: N }), s.model = V.model ?? s.model, f = Kn(V.blueprint);
        for (const st of pd(f, r)) {
          const it = `The model labelled a screen ${st}; the pipeline sets the mode, so it is "${r}".`;
          i.includes(it) || i.push(it);
        }
        const Xt = cl(f, n, r);
        Xt.length > 0 && l(`step 2 · rested ${Xt.length} stray focus: ${Xt.join("; ")}`);
        const Qt = dl(f, n, r);
        Qt.length > 0 && l(`step 2 · stretched ${Qt.length} root(s): ${Qt.join("; ")}`), Ne = JSON.stringify(f);
        const eo = zl(f, n, r), wi = r === "exploratory" ? $d(f, n) : [], It = [...eo.ok ? [] : eo.issues, ...wi];
        if (It.length === 0) {
          let st = [];
          if (st.length === 0)
            return l(`step 2 · generator: valid on attempt ${N}${ar ? " · render check clean" : ""}`), { blueprint: f, valid: !0 };
          if (N > ye)
            return l(`step 3 · render check: ${st.length} problem(s) remain after ${ye} retr${ye === 1 ? "y" : "ies"} — the canvas reports them`), { blueprint: f, valid: !0 };
          Xn = !0, It.push(...st.map((it) => ({ ruleId: it.ruleId, path: ["root"], message: it.message })));
        }
        L = It, H = lr(It, r);
      } catch (V) {
        if (!(V instanceof Sn) || (Ne = V.raw.slice(0, 6e3), H = [
          `Your reply was not valid JSON (${V.message}). Reply with ONLY the JSON object — no prose, no comments, no trailing commas, every key and string double-quoted.`
        ], L = [], N > ye)) throw V;
      }
      h = H, l(`step 3 · validate: attempt ${N} had ${H.length} issue(s)`);
      const Kt = {
        ...t.branch ? { branch: t.branch } : {},
        plan: g,
        attempt: N,
        issues: L.length > 0 ? L.map((V) => ({ ruleId: V.ruleId, ...V.kind ? { kind: V.kind } : {}, path: V.path, message: V.message })) : H.map((V) => ({ ruleId: "blueprint.dsl", path: [], message: V }))
        // a reply that was not JSON
      }, Qn = Qa(f, L);
      if (Qn.length > 0 && (Kt.nodeDeclarationConflicts = Qn), a.push(Kt), g < y && (z = hd(L, N <= ye), z)) {
        Kt.trigger = z;
        break;
      }
      N <= ye && (W.push({ role: "assistant", content: Ne }), W.push({
        role: "user",
        content: `${Xn ? "That Blueprint is valid, but painted on the 1280×720 frame it has problems" : "That Blueprint is invalid"}:
${H.map((V) => `- ${V}`).join(`
`)}

Return the corrected JSON — same structure, only fixing these problems. Do not mention the fixes in "notes".`
      }));
    }
    if (z) {
      l(`step 3 · replan ${g + 1}/${y} — trigger: ${z}`), p = [
        ...p,
        { role: "assistant", content: b },
        {
          role: "user",
          content: `The screen built from that plan failed the audit:
${lr(L, r).map((N) => `- ${N}`).join(`
`)}

Write the corrected plan for the same request. Where the request needs a break, plan it with a "Deviation:" line; where it does not, keep the patterns.`
        }
      ];
      continue;
    }
    break;
  }
  return l(
    `step 3 · validate: still invalid after ${ye} retr${ye === 1 ? "y" : "ies"} (${h.length} issue(s)) — repairing on render`
  ), { blueprint: f, valid: !1 };
}
const En = Se / 2, yd = "Exploratório não encontrou nada a quebrar — só a tela Fidedigna foi mantida.", cr = (t) => `Os dois cabe até ${En} telas por modo (máx. ${Se}); este fluxo tem ${t} — gerado só em Fidedigno. Peça o Exploratório separadamente.`;
function gd(t) {
  return Math.max(1, (t.match(/^[ \t]*screen[ \t]+[A-Za-z0-9_-]+[ \t]*:/gim) ?? []).length);
}
async function vd(t, e, n) {
  var S;
  const { provider: o, manifest: r, options: s, acc: i, steps: a, notices: l } = n, c = [...e, { role: "user", content: t }], d = await o.complete({
    system: Ws(r, { prompt: t, mode: "faithful" }),
    messages: c,
    model: s.model,
    effort: "low"
  });
  An(i, d.usage, { step: "planner", attempt: 0 }), i.model = d.model;
  const u = Ts(d.text, Wn(r)), y = gd(d.text);
  a.push(`step 1 · Os dois: one Faithful plan (${y} screen${y === 1 ? "" : "s"}) · template: ${((S = u.template) == null ? void 0 : S.id) ?? u.reason}, locked for both branches`);
  const p = () => In({ ...n, mode: "faithful", branch: "F", plannerMessages: c, firstPlan: d.text, template: u });
  if (y > En)
    return l.push(cr(y)), { blueprint: He((await p()).blueprint, null), mode: "faithful", branches: 1 };
  const [f, h] = await Promise.allSettled([
    p(),
    In({
      ...n,
      mode: "exploratory",
      branch: "E",
      plannerMessages: [...e, { role: "user", content: hi(t, d.text) }],
      template: u
    })
  ]), m = (R) => R.status === "rejected" ? R.reason instanceof Error ? R.reason.message : String(R.reason) : "";
  if (f.status === "rejected" && h.status === "rejected") throw f.reason;
  if (h.status === "rejected")
    return l.push(`Exploratório falhou (${m(h)}) — só a tela Fidedigna foi gerada.`), { blueprint: He(f.value.blueprint, null), mode: "faithful", branches: 1 };
  if (f.status === "rejected")
    return l.push(`Fidedigno falhou (${m(f)}) — só a tela Exploratória foi gerada.`), { blueprint: He(null, h.value.blueprint), mode: "exploratory", branches: 1 };
  const g = Math.max(Zt(f.value.blueprint).length, Zt(h.value.blueprint).length);
  if (g > En)
    return l.push(cr(g)), a.push(`step 4 · Os dois: the branches produced ${g} screens, over the limit — only the Faithful screens were kept`), { blueprint: He(f.value.blueprint, null), mode: "faithful", branches: 2 };
  const b = wd(f.value.blueprint, h.value.blueprint, r);
  return b || bd(h.value.blueprint) ? (l.push(yd), a.push(
    b ? "step 4 · Os dois: the Exploratory screens are structurally identical to the Faithful ones — dropped" : "step 4 · Os dois: the Exploratory screens declare no deviation, Proposal or primitive — dropped"
  ), { blueprint: He(f.value.blueprint, null), mode: "faithful", branches: 2 }) : (a.push("step 4 · Os dois: merged the Faithful and the Exploratory screens"), { blueprint: He(f.value.blueprint, h.value.blueprint), mode: "both", branches: 2 });
}
function bd(t) {
  const e = (n) => fe(n) ? n.deviation || n.type === Ue || yt(n.type) ? !1 : (Array.isArray(n.children) ? n.children : []).every(e) : !0;
  return Zt(t).every((n) => {
    const o = fe(n.screen) ? n.screen : {};
    return !(Array.isArray(o.deviation) && o.deviation.length > 0) && o.shades === void 0 && e(n.root);
  });
}
function dr(t, e) {
  const n = ei(t, e);
  return n.ok ? JSON.stringify(n.screens.map((o) => o.tree), (o, r) => o === "id" ? void 0 : r) : null;
}
function wd(t, e, n) {
  const o = dr(t, n);
  return o !== null && o === dr(e, n);
}
function Zt(t) {
  if (!fe(t)) return [];
  const { screens: e, version: n, notes: o, ...r } = t;
  return [r, ...Array.isArray(e) ? e.filter(fe) : []];
}
function He(t, e) {
  const n = (c, d, u, y) => {
    const p = Zt(c), f = new Map(p.map((m, g) => [String(m.id ?? Sr), `${d}-${g + 1}`])), h = (m) => {
      fe(m) && (typeof m.goTo == "string" && f.has(m.goTo) && (m.goTo = f.get(m.goTo)), Array.isArray(m.children) && m.children.forEach(h));
    };
    return p.map((m, g) => {
      const b = structuredClone(m);
      return h(b.root), b.id = `${d}-${g + 1}`, b.name = p.length === 1 ? u : `${u} · ${m.name ?? m.id ?? g + 1}`, y === "exploratory" ? b.mode = y : delete b.mode, b;
    });
  }, o = [
    ...t !== null ? n(t, "faithful", "Fidedigno", "faithful") : [],
    ...e !== null ? n(e, "exploratory", "Exploratório", "exploratory") : []
  ], r = (c) => fe(c) && Array.isArray(c.notes) ? c.notes.filter((d) => typeof d == "string") : [], s = dt / 2, i = t !== null && e !== null ? [
    ...r(t).slice(0, s).map((c) => `Fidedigno: ${c}`),
    ...r(e).slice(0, s).map((c) => `Exploratório: ${c}`)
  ] : r(t ?? e), [a, ...l] = o;
  return { version: 1, ...a, ...i.length > 0 ? { notes: i } : {}, screens: l };
}
function $d(t, e) {
  const n = ei(t, e);
  if (!n.ok) return [];
  const o = fe(t) && Array.isArray(t.screens) ? t.screens : [], r = n.screens.length > 1;
  return n.screens.flatMap((s, i) => {
    const a = o.findIndex((c) => fe(c) && c.id === s.id), l = i === 0 || a < 0 ? [] : ["screens", a];
    return es(s.tree).map((c) => ({
      ...c,
      path: [...l, ...c.path],
      message: r ? `Screen "${s.id}": ${c.message}` : c.message
    }));
  });
}
function ur(t, e, n) {
  return { mode: t, ...e.length > 0 ? { notices: e } : {}, ...n.length > 0 ? { trace: n } : {} };
}
function hr(t, e, n, o, r, s, i) {
  return {
    ok: !0,
    blueprint: t,
    meta: {
      source: "llm",
      provider: e.id,
      model: n,
      usage: o,
      durationMs: Date.now() - s,
      steps: r,
      ...i
    }
  };
}
function pi(t, e, n) {
  return Math.max(e, Math.min(n, t));
}
const kd = I({
  role: C(["user", "assistant"]),
  content: w().max(2e4)
}).strict(), xd = I({
  model: C(sa).optional(),
  effort: C(aa).optional(),
  mode: C(Ei).optional()
}).strict(), _d = I({
  prompt: w().trim().min(1, "Prompt is empty").max(2e3, "Prompt is too long"),
  history: q(kd).max(40).optional(),
  options: xd.optional(),
  manifest: Nn.optional()
}).strict();
async function Sd(t) {
  var n;
  const e = _d.safeParse(t);
  if (!e.success)
    return {
      ok: !1,
      error: ((n = e.error.issues[0]) == null ? void 0 : n.message) ?? "Invalid request",
      stage: "ipc:validate-request",
      meta: { source: "dummy", durationMs: 0, steps: ["rejected malformed request"] }
    };
  try {
    console.log(`[ipc] ${an.generateUI} <- ${JSON.stringify(e.data.prompt)}`);
    const o = await fd(
      e.data.prompt,
      e.data.history ?? [],
      e.data.options ?? {},
      e.data.manifest
    );
    return console.log(`[ipc] ${an.generateUI} -> ok=${o.ok} source=${o.meta.source}`), o;
  } catch (o) {
    return {
      ok: !1,
      error: o instanceof Error ? o.message : String(o),
      stage: "orchestrator",
      meta: { source: "dummy", durationMs: 0, steps: ["orchestrator threw"] }
    };
  }
}
const Td = "design-systems", fi = "meta.json";
function On() {
  return B.join(Xe.getPath("userData"), Td);
}
function me() {
  return On();
}
function mi() {
  return B.join(me(), fi);
}
function At(t) {
  const e = t.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "_").slice(0, 120);
  if (!e) throw new Error("Empty design-system id");
  return e;
}
async function Yt() {
  await he.mkdir(me(), { recursive: !0 });
}
async function yi(t) {
  try {
    return await he.access(t), !0;
  } catch {
    return !1;
  }
}
async function Ad() {
  await Yt();
  let t;
  try {
    t = await he.readdir(me());
  } catch {
    return [];
  }
  const e = [];
  for (const n of t)
    if (!(!n.endsWith(".json") || n === fi))
      try {
        const o = JSON.parse(await he.readFile(B.join(me(), n), "utf8")), r = Nn.safeParse(o);
        r.success ? e.push(r.data) : console.warn(`[storage] ignoring invalid design system: ${n}`);
      } catch (o) {
        console.warn(`[storage] failed to read ${n}:`, o);
      }
  return e;
}
async function Id(t) {
  const e = Nn.parse(t);
  return await Yt(), await he.writeFile(
    B.join(me(), `${At(e.id)}.json`),
    JSON.stringify(e, null, 2),
    "utf8"
  ), e;
}
async function Ed(t) {
  if (typeof t != "string" || !t) return;
  const e = At(t);
  await he.rm(B.join(me(), `${e}.json`), { force: !0 }), await he.rm(B.join(me(), `${e}.bundle.js`), { force: !0 });
}
const pr = 2 * 1024 * 1024;
async function Od(t, e) {
  if (typeof t != "string" || !t) throw new Error("Missing design-system id");
  if (typeof e != "string" || e.trim().length === 0)
    throw new Error("Bundle must be non-empty JavaScript source");
  if (Buffer.byteLength(e, "utf8") > pr)
    throw new Error(`Bundle exceeds the ${pr / (1024 * 1024)} MB limit`);
  const n = At(t);
  if (!await yi(B.join(me(), `${n}.json`)))
    throw new Error(`No imported design system with id "${t}" — import its components first`);
  await Yt(), await he.writeFile(B.join(me(), `${n}.bundle.js`), e, "utf8");
}
async function Cd(t) {
  return typeof t != "string" || !t ? !1 : yi(B.join(me(), `${At(t)}.bundle.js`));
}
async function Nd() {
  try {
    const t = JSON.parse(await he.readFile(mi(), "utf8"));
    return t && typeof t == "object" ? t : {};
  } catch {
    return {};
  }
}
async function jd() {
  const t = await Nd();
  return typeof t.activeId == "string" ? t.activeId : null;
}
async function Rd(t) {
  typeof t != "string" || !t || (await Yt(), await he.writeFile(mi(), JSON.stringify({ activeId: t.slice(0, 120) }), "utf8"));
}
function Pd() {
  ke.handle(
    an.generateUI,
    (t, e) => Sd(e)
  ), ke.handle(je.list, () => Ad()), ke.handle(je.save, (t, e) => Id(e)), ke.handle(je.delete, (t, e) => Ed(e)), ke.handle(je.getActive, () => jd()), ke.handle(je.setActive, (t, e) => Rd(e)), ke.handle(je.saveBundle, (t, e, n) => Od(e, n)), ke.handle(je.hasBundle, (t, e) => Cd(e));
}
const gi = "design-system";
function Ld() {
  vr.registerSchemesAsPrivileged([
    {
      scheme: gi,
      privileges: { standard: !0, secure: !0, supportFetchAPI: !0, corsEnabled: !1 }
    }
  ]);
}
function Md() {
  vr.handle(gi, async (t) => {
    let e;
    try {
      e = new URL(t.url);
    } catch {
      return new Response(null, { status: 400 });
    }
    if (e.pathname !== "/bundle.js") return new Response(null, { status: 404 });
    let n;
    try {
      n = At(e.hostname);
    } catch {
      return new Response(null, { status: 400 });
    }
    const o = B.join(On(), `${n}.json`), r = B.join(On(), `${n}.bundle.js`);
    return !await fr(o) || !await fr(r) ? new Response(null, { status: 404 }) : xi.fetch($i(r).toString());
  });
}
async function fr(t) {
  try {
    return await Ii(t), !0;
  } catch {
    return !1;
  }
}
const vi = B.dirname(ki(import.meta.url));
Ld();
const Bd = vi, Dd = B.join(vi, "../dist"), mr = process.env.VITE_DEV_SERVER_URL;
function bi() {
  const t = new br({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: Z.gray[100],
    // matches the renderer's `bg-page`
    title: "ScreenFlow Studio",
    webPreferences: {
      preload: B.join(Bd, "preload.cjs"),
      // Full renderer sandbox: no Node, isolated JS world, preload limited to the
      // `electron` module. The API key and every LLM call stay in this process;
      // the renderer only ever sees validated Blueprint JSON over the IPC bridge.
      contextIsolation: !0,
      nodeIntegration: !1,
      sandbox: !0
    }
  });
  mr ? (t.loadURL(mr), t.webContents.openDevTools({ mode: "detach" }), t.webContents.on("did-finish-load", async () => {
    const e = await t.webContents.executeJavaScript("typeof window.flow?.generateUI");
    console.log(`[main] bridge: window.flow.generateUI is ${e} · AI: ${await td()}`);
    const n = process.env.SFS_EVAL_FILE;
    if (n) {
      const { readFileSync: r } = await import("node:fs");
      try {
        const s = await t.webContents.executeJavaScript(r(n, "utf8"));
        console.log("[smoke:eval] result:", typeof s == "string" ? s : JSON.stringify(s));
      } catch (s) {
        console.log("[smoke:eval] error:", s instanceof Error ? s.message : String(s));
      }
      process.env.SFS_EVAL_QUIT && Xe.quit();
    }
    const o = process.env.SFS_SMOKE_PROMPT;
    if (o) {
      console.log(`[smoke] generating (rendering to canvas): ${JSON.stringify(o)}`);
      const r = await t.webContents.executeJavaScript(
        `(async () => {
             for (let i = 0; i < 40 && !window.__sfsSend; i++) await new Promise(r => setTimeout(r, 100))
             await window.__sfsSend?.(${JSON.stringify(o)})
             return JSON.stringify(window.__sfsReport?.() ?? {})
           })()`
      );
      console.log(`[smoke] report:
` + r);
    }
  })) : t.loadFile(B.join(Dd, "index.html"));
}
Xe.whenReady().then(() => {
  Md(), Pd(), bi();
});
Xe.on("activate", () => {
  br.getAllWindows().length === 0 && bi();
});
Xe.on("window-all-closed", () => {
  process.platform !== "darwin" && Xe.quit();
});
