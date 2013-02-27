
describe("GDT", function() {
  return describe("app", function() {
    var app;
    app = null;
    before(function(done) {
      return app = new App({
        callback: done
      });
    });
    return it("app test-1", function() {
      return expect(app).to.be.a("object");
    });
  });
});
