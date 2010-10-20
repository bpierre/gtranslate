Components.utils.import("resource://gesturegoogtrans/JSON.js");

function run_test() {
  let foo = {};
  foo.a = 3;

  let bar = JSON.stringify(foo);
  do_check_eq(bar, '{"a":3}');

  let baz = JSON.parse(bar);
  do_check_eq(baz.a, 3);
}
