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
    return @el

  on_mouseDown: (e) =>
    app.draggedObj = this
    @el.addClass("drag")
    offset = @el.offset()
    @offset = {x: offset.left + e.offsetX, y: offset.top + e.offsetY}
    $(document).one("mouseup", @on_mouseUp)
    $(document).on("mousemove", @mouseMove)
    $(document).trigger("start-drag", this)

  on_mouseUp: (e) =>
    $(document).off("mousemove", @mouseMove)
    $(document).trigger("drop", {x: e.pageX, y: e.pageY, obj: app.draggedObj})

    app.draggedObj = null
    @el.css({top: 0, left: 0})
    @el.removeClass("drag")
    @offset = null

  mouseMove: (e) =>
    @el.css({top: e.pageY - @offset.y, left: e.pageX - @offset.x})

  remove: ->
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
    @nameInput   = @el.find(".name-input")
    @bugCheckbox = @el.find(".isbug-input")
    @resetButton = @el.find(".reset-btn")
    @el.focus()

    $(document).keyup(@on_keyUp)
    @resetButton.click(@on_resetBtnClick)

  on_keyUp: (e) =>
    if e.keyCode is 13
      type = if @bugCheckbox.prop("checked") then CARD_BUG else CARD_TASK
      $(document).trigger("submit-card", {name: @nameInput.val(), type: type})
      @nameInput.val('')

  on_resetBtnClick: (e) =>
    $(document).trigger("reset-storage")


class App

  _loadFromStorage: ->
    result = {}
    for i in [0...localStorage.length]
      key = localStorage.key(i)
      result[key] = JSON.parse(localStorage.getItem(key))
    return result

  constructor: ->
    @draggedObj    = null
    @createCardView = new CreateCardView(id: "create-card")

    @todoList      = new TaskListView(id: "todo", state: STATE_TODO)
    @inProcessList = new TaskListView(id: "in-progress", state: STATE_PROGRESS)
    @doneList      = new TaskListView(id: "done", state: STATE_DONE)
    @_resetLists()

    $(document).on("submit-card", @on_submitCard)
    $(document).on("reset-storage", @on_resetStorage)

  _resetLists: ->
    @todoList.reset()
    @inProcessList.reset()
    @doneList.reset()

    $.getJSON "cards.json", (data) =>
      cards = {}
      for card in data
        cards[card.id] = card
      $.extend(cards, @_loadFromStorage())    
      for key, card of cards
        card.state ?= STATE_TODO
        switch card.state
          when STATE_TODO     then @todoList.add(new TaskView(card)) 
          when STATE_PROGRESS then @inProcessList.add(new TaskView(card)) 
          when STATE_DONE     then @doneList.add(new TaskView(card)) 
      @todoList.render()
      @inProcessList.render()
      @doneList.render()

  on_submitCard: (e, data) =>
    @createCard(data.name, data.type)

  on_resetStorage: (e) =>
    localStorage.clear()
    @_resetLists()

  createCard: (name, type = CARD_TASK) ->
    return unless name
    card = 
      id: _.uniqueId()
      name: name
      type: type
    card.id = _.uniqueId() while localStorage[card.id]
    @todoList.add(new TaskView(card)) 
    @todoList.render()

$ ->
  window.app = new App