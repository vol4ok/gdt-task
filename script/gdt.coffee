# Card types
CARD_TASK = "task"
CARD_BUG  = "bug"

# Card states
STATE_UNDEFINED = 0
STATE_TODO      = 1
STATE_PROGRESS  = 2
STATE_DONE      = 3


class TaskView
  template: "<div class=\"card <%= type %>\" id=\"task-<%= id %>\">#<%= id %> <%= name %></div>"
  constructor: (data) ->
    @render(data)

  setState: (state) ->
    return unless STATE_TODO <= state <= STATE_DONE
    @data.state = state
    localStorage[@id] = JSON.stringify(@data)

  render: (data) ->
    return @el unless data 
    @id = data.id
    @data = data
    
    localStorage[@id] = JSON.stringify(@data)
    @el = $(_.template(@template, @data))
    @el.mousedown(@on_mouseDown)
    @el.click(@on_click)
    @el.dblclick(@on_doubleClick)
    $(document).on("select-card", @on_selectCard)
    return @el

  on_click: (e) =>
    return if @el.hasClass("edit")
    $(document).trigger("select-card", @id)

  on_selectCard: (e, id) =>
    if @id == id
      @el.addClass("active")
      $(document).on("keydown", @on_globalKeyDown)
    else
      $(document).off("keydown", @on_globalKeyDown)
      @el.removeClass("active")

  on_doubleClick: (e) =>     
    return if @el.hasClass("edit")
    @el.addClass("edit")
    @el.attr("contenteditable", "true")
    @el.text(@data.name)
    range = document.createRange()
    sel = window.getSelection()
    range.setStart(@el.get(0), 1)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
    @el.focus()
    @el.one("blur", @on_blur)
    @el.on("keydown", @on_keyDown)
    
  on_blur: (e) =>
    return unless @el.hasClass("edit") 
    @el.off("keydown")
    @el.removeAttr("contenteditable")
    @el.removeClass("edit")
    @data.name = @el.text()
    @el.text("##{@id} #{@data.name}")
    localStorage[@id] = JSON.stringify(@data)


  on_keyDown: (e) =>
    if @el.hasClass("edit") and e.keyCode is 13
      @el.trigger("blur")

  on_globalKeyDown: (e) =>
    if @el.hasClass("active") and (e.keyCode is 8 or e.keyCode is 46)
      e.preventDefault()
      $(document).trigger("remove-card", this)
      return false


  on_mouseDown: (e) =>
    return if @el.hasClass("edit")
    app.draggedObj = this
    @el.addClass("drag")
    offset = @el.offset()
    @offset = {x: offset.left + e.offsetX, y: offset.top + e.offsetY}
    $(document).one("mouseup", @on_mouseUp)
    $(document).on("mousemove", @on_mouseMove)
    $(document).trigger("start-drag", this)

  on_mouseUp: (e) =>
    $(document).off("mousemove", @on_mouseMove)
    $(document).trigger("drop", {x: e.pageX, y: e.pageY, obj: app.draggedObj})

    app.draggedObj = null
    @el.css({top: 0, left: 0})
    @el.removeClass("drag")
    @offset = null

  on_mouseMove: (e) =>
    @el.css({top: e.pageY - @offset.y, left: e.pageX - @offset.x})

  remove: ->
    $(document).off("keydown", @on_globalKeyDown)
    $(document).off("select-card", @on_selectCard)
    $(document).off("mousemove", @on_mouseMove)
    @el.remove()
    delete @el


class TaskListView
  constructor: (options) ->
    @state = options.state
    @id = options.id
    @el = $("#" + @id)
    $(document).on("start-drag",@on_startDrag)
    $(document).on("drop", @on_drop)
    @views = {}

  add: (view) ->
    return false if @views[view.id]
    view.setState(@state)
    @views[view.id] = view
    return true

  reset: () ->
    view.remove() for key, view of @views
    @views = {}

  remove: (view) ->
    return false unless @views[view.id]
    delete @views[view.id]
    return true

  render: ->
    for id, view of @views
      @el.append(view.render())

  on_startDrag: (e) =>
    @offset = @el.offset()
    @offset.bottom = @offset.top + @el.height()
    @offset.right = @offset.left + @el.width()

  on_drop: (e, ctx) =>
    if (@offset.left <= ctx.x <= @offset.right) and (@offset.top <= ctx.y <= @offset.bottom)
      @render() if @add(ctx.obj)
    else
      @render() if @remove(ctx.obj)



class CreateCardView

  constructor: (options) ->
    @id = options.id
    @el = $("#" + @id)
    @nameInput   = @el.find(".name")
    @bugCheckbox = @el.find(".isbug")
    @resetButton = @el.find(".reset")
    @loadButton  = @el.find(".load")

    @el.focus()

    $(document).keyup(@on_keyUp)
    @resetButton.click(@on_resetBtnClick)
    @loadButton.click(@on_loadBtnClick)

  on_keyUp: (e) =>
    if e.keyCode is 13
      type = if @bugCheckbox.prop("checked") then CARD_BUG else CARD_TASK
      $(document).trigger("submit-card", {name: @nameInput.val(), type: type})
      @nameInput.val('')

  on_resetBtnClick: (e) =>
    $(document).trigger("reset-storage")

  on_loadBtnClick: (e) =>
    $(document).trigger("load-default")


class App

  constructor: (options = {}) ->
    @draggedObj    = null
    @createCardView = new CreateCardView(id: "create-card")

    @todoList      = new TaskListView(id: "todo", state: STATE_TODO)
    @inProcessList = new TaskListView(id: "in-progress", state: STATE_PROGRESS)
    @doneList      = new TaskListView(id: "done", state: STATE_DONE)

    @_initLists()

    $(document).on("submit-card", @on_submitCard)
    $(document).on("reset-storage", @on_resetStorage)
    $(document).on("load-default", @on_loadDefault)
    $(document).on("remove-card", @on_removeCard)

  _renderLists: ->
    @todoList.render()
    @inProcessList.render()
    @doneList.render()

  _resetLists: (done) ->
    @todoList.reset()
    @inProcessList.reset()
    @doneList.reset()

  _loadCards: ->
    result = {}
    isNumRexp = /\d+/
    for i in [0...localStorage.length]
      key = localStorage.key(i)
      continue unless isNumRexp.test(key)
      result[key] = JSON.parse(localStorage[key])
    return result

  _initLists: ->
    @_resetLists()
    for key, card of @_loadCards()
      card.state ?= STATE_TODO
      switch card.state
        when STATE_TODO     then @todoList.add(new TaskView(card)) 
        when STATE_PROGRESS then @inProcessList.add(new TaskView(card)) 
        when STATE_DONE     then @doneList.add(new TaskView(card)) 
    @_renderLists()

  _loadDefaultCards: (done) ->
    $.getJSON "cards.json", (data) =>
      for card in data when not localStorage[card.id]
        card.state ?= STATE_TODO
        localStorage[card.id] = JSON.stringify(card) 
      done?()

  on_submitCard: (e, data) =>
    @createCard(data.name, data.type)

  on_resetStorage: (e) =>
    localStorage.clear()
    @_resetLists()
    @_renderLists()

  on_loadDefault: =>
    @_loadDefaultCards => @_initLists()

  on_removeCard: (e, view) =>
    @todoList.remove(view) 
    @inProcessList.remove(view) 
    @doneList.remove(view) 
    localStorage.removeItem(view.id)
    view.remove()

  createCard: (name, type = CARD_TASK) ->
    return unless name
    card = 
      id: _.uniqueId()
      name: name
      type: type
    card.id = _.uniqueId() while localStorage[card.id]
    @todoList.add(new TaskView(card)) 
    @todoList.render()