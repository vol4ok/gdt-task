describe "GDT", ->

  describe "app", ->

    localStorage.clear()
    app = new App

    it "shoudl create card and add it in todo list", ->
      app.createCard("test")
      expect(localStorage["1"]).to.exist
      obj = JSON.parse(localStorage["1"])
      expect(obj).to.be.a("object")
      expect(obj).to.have.property("name", "test")
      expect(obj).to.have.property("type", "task")
      expect(obj).to.have.property("id", "1")

      expect(app.todoList.views["1"]).to.exist
      expect(app.todoList.views["1"].id).to.equal("1")
      obj = app.todoList.views["1"].data
      expect(obj).to.have.property("name", "test")
      expect(obj).to.have.property("type", "task")
      expect(obj).to.have.property("id", "1")

    it "shoudl reset cards", ->
      app.createCard("test-2")
      expect(localStorage["2"]).to.exist
      expect(app.todoList.views["2"]).to.exist
      $(document).trigger("reset-storage")
      expect(localStorage["2"]).to.not.exist
      expect(app.todoList.views["2"]).to.not.exist



