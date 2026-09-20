type Cfg = { variable?: string; [k: string]: unknown };
const mk = (c: Cfg = {}) => ({ variable: (c.variable as string) || "", className: "" });
export const Space_Grotesk = (c: Cfg) => mk(c);
export const Inter = (c: Cfg) => mk(c);
