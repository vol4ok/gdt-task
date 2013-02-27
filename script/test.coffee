describe "GDT", ->

  describe "app", ->

    app = null

    before (done) ->
      app = new App(callback: done)

    it "app test-1", ->
      expect(app).to.be.a("object")

    # it "shoudl create card and add it in todo list", ->
    #   app.createCard("test card", CARD_TASK)
    #   console.log app.todoList.views
    #   expect(app).to.be.a("object")

    # it "shoudl reset localStorage", ->
    #   expect(app).to.be.a("object")



