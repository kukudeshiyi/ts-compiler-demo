const i18n = {
  t: (value: string) => {
    return value;
  },
};

const i = true;
const test = () => {
  return "spc_test_three";
};

i18n.t("apc_trans");
i18n.t("spc_test_trans");
i18n.t(i ? "spc_test_one" : "spc_test_two");
i18n.t(i ? test() : "spc_test_two");
