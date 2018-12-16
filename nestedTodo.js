var helpers = {
  store: function(listname, data) {
    if (arguments.length > 1) {
      return localStorage.setItem(listname, JSON.stringify(data));
    } else {
      var todoList = localStorage.getItem(listname);
      return (todoList && JSON.parse(todoList)) || [];
    }
  },
  // uuid method taken from todoMVC
  uuid: function () {
    /*jshint bitwise:false */
    var i, random;
    var uuid = '';

    for (i = 0; i < 32; i++) {
      random = Math.random() * 16 | 0;
      if (i === 8 || i === 12 || i === 16 || i === 20) {
        uuid += '-';
      }
      uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
    }

    return uuid;
  },
}
    
var App = {
  init: function() {
    this.todoList = helpers.store('todo-list');
    var todoListUl = document.getElementById('todo-list');
    this.renderTodoList(this.todoList, todoListUl);
    this.bindEvents();
  },
  bindEvents: function() {
    document.getElementById('newfuckingtodo').addEventListener('keyup', function(e) {
      this.createNewTodo(e);
    }.bind(this));
    document.getElementById('clear-whole-todoList').addEventListener('click', this.clearAllTodos.bind(this));
    document.getElementById('clear-completed').addEventListener('click', function() {
      this.clearCompleted(App.todoList);
    }.bind(this));
    // todo-list event listeners
    var todoList = document.getElementById('todo-list');
    todoList.addEventListener('change', function(e) {
        if (e.target.className === 'checkbox') {
          this.toggle(e);
        }
      }.bind(this));
    todoList.addEventListener('keyup', function(e) {
      if (e.target.className === 'edit-box') {
        this.editTodo(e);
      }
    }.bind(this));
    todoList.addEventListener('mousedown', function (e) {
      if (e.target.nodeName === 'SPAN') {
        var parentLi = App.getParentElementByNodename('LI', e.target);
        this.createNestedInputBox(parentLi);
      }
    }.bind(this));
    todoList.addEventListener('dblclick', function(e) {
      if (e.target.nodeName === 'LABEL') {
        var parent =  e.target.parentElement;
        var input = parent.nextElementSibling;
        input.style.opacity = 0.33;
        input.focus();
      }
    });
    todoList.addEventListener('focusout', function(e) {
      if (e.target.className === 'edit-box') {
        e.target.style.opacity = 0;
      }
    }.bind(this));
    todoList.addEventListener('focusout', function(e) {
      if (e.target.className === 'nested') {
        e.target.style.opacity = 0;
      }
    });
    todoList.addEventListener('keyup', function(e) {
      if (e.target.id === 'nested') {
        this.createNewTodo(e);
      }
    }.bind(this));
  }, 
  createNewTodo: function(e) {
    var targetId = e.target.id;
    var parentId = e.target.className;
    var newTodo = document.getElementById(targetId);
    if (e.which !== 13 || !newTodo.value) {
      return;
    }
    var todoText = newTodo.value;
    var newTodoObject = {
      todoText: todoText,
      id: helpers.uuid(),
      completed: false,
      nested: false // this is the base case for recursive access methods.
    }
    newTodo.value = '';
    var todoList = this.todoList;
    this.storeNewTodo(newTodoObject, todoList, parentId);
  },
  storeNewTodo: function(newTodoObject, todoList, parentId) {
    // if not nested, parentId is 'newtodo'.
    // if nested, parentId is the uuid of the parent todolist element.
    if (parentId === 'newtodo') {
      // non-nested
      this.todoList.push(newTodoObject);
    } else {
      // nested
      newTodoObject.nested = true;
      function searchTheNest(newTodoObject, parentId, todoList) {
        for (var i = 0; i < todoList.length; i++) {
          var nestedTodoList = todoList[i].nestedTodos || [];; // access the nestedTodos array, or create empty array.
          if (todoList[i].id === parentId) {
            // base case: push newTodo onto nested Array, or create nestedArray if necessary.
            nestedTodoList.push(newTodoObject);
            todoList[i].nestedTodos = nestedTodoList;
          } else {
            searchTheNest(newTodoObject, parentId, nestedTodoList);
          } 
        }
      }
      searchTheNest(newTodoObject, parentId, todoList);
    }
    helpers.store('todo-list', this.todoList);
    var todoListUl = document.getElementById('todo-list');
    this.renderTodoList(this.todoList, todoListUl);
  },
  createTodoLi: function(el, todoListUl) {
    var todoList = todoListUl;
    var todoLi = document.createElement('li');
    todoLi.id = el.id;
    if (el.completed) {
      todoLi.className = 'completed';
    }
    var div = document.createElement('div');    
    div.className = 'view';
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'checkbox';
    checkbox.checked = el.completed;
    var label = document.createElement('label');
    label.textContent = el.todoText;
    if (checkbox.checked) {
      label.style.textDecoration = 'line-through';
    }
    var editBox = document.createElement('input');
    editBox.className = 'edit-box';
    editBox.style.opacity = 0;
    editBox.placeholder = 'Update Your Shit'; 
    // create an element to be clicked for nested recursive addition.
    var recursion = document.createElement('span');
    recursion.id = 'top';
    recursion.textContent = '+';
    // Organize the DOM
    todoList.appendChild(todoLi); 
    todoLi.appendChild(div);
    div.appendChild(recursion);
    div.appendChild(checkbox);
    div.appendChild(label);
    todoLi.appendChild(editBox);
  },
  createNestedUl: function(parentLi) {
    for (var i = 0; i < parentLi.childNodes.length; i++) {
      // return the ul child node of the parentLi if it already exists.
      if (parentLi.childNodes[i].tagName === 'UL') {
        return parentLi.childNodes[i];
      } else {
        // create a ul node and append to the parentLi.
        var nestedUl = document.createElement('ul');
        nestedUl.className = 'nested';
        nestedUl.classList.add(parentLi.id);
        parentLi.appendChild(nestedUl);
        return nestedUl;
      }
    }
  },
  editTodo: function(e) {
    if (e.which !== 13) {
      return;
    }
    // get index of the todo item
       // index will be the same on both the DOM ul and on the matching todoList array.
    var todo = e.target.parentElement;
    var parentUl = this.getParentElementByNodename('UL', todo);
    var index = this.indexFromDomNode(todo, parentUl);
    var parentLi = this.getParentElementByNodename('LI', todo);
    var parentTodoList = this.getParentTodolistArray(parentLi);
    parentTodoList[index].todoText = e.target.value;
    e.target.value = ''; 
    // Remove all nodes from the todoList ul and re-render the todoList.
    var todoList = document.getElementById('todo-list');
    while (todoList.firstChild) {
      todoList.removeChild(todoList.firstChild);
    }
    helpers.store('todo-list', this.todoList); 
    var todoListUl = document.getElementById('todo-list');
    this.renderTodoList(this.todoList, todoListUl);
  },
  indexFromDomNode: function (el, parentTodoList) {
    var id = el.getAttribute('id');
    var todos;
    if (Array.isArray(parentTodoList)) {
      todos = this.todoList;
    } else {
      todos = parentTodoList.childNodes;
    }
    var i = todos.length;
    while (i--) {
      if (todos[i].id === id) {
        return i;
      }
    }
  },
  getTodoListElById: function (id) {
    var todoList = this.todoList;
    var todoObject;
    // recursive method.
    function getElById(todoList, id) {
      // start with the un-nested todoList.
      for (var i = 0; i < todoList.length; i++) {
        if (todoList[i].id === id) {
          todoObject = todoList[i];
        }
      }
      // check nested lists.
      if (todoObject === undefined) {
        todoList.forEach(function(todo) {
          if (Array.isArray(todo.nestedTodos)) {
            return getElById(todo.nestedTodos, id);
          }
        }) 
      }
      return todoObject;
    }
    return getElById(todoList, id);
  },
  clearTodoLi: function(el, todoListUl) {
    var id = el.id;
    var todoList = todoListUl;
    var todoListEls = todoList.childNodes;
    var i = todoListEls.length;
    while (i--) {
      if (todoListEls[i].id === id) {
        todoListEls[i].remove();
      }
    }
  },
  toggle: function(e) {
    var checkbox =  e.target;
    var todo = this.getParentElementByNodename('LI', checkbox);
    var parentUl= this.getParentElementByNodename('UL', todo);
    var index = this.indexFromDomNode(todo, parentUl);
    var view = todo.firstChild;
    var label = view.childNodes[2];
    
    var parentTodoList = this.getParentTodolistArray(todo);
    parentTodoList[index].completed = !parentTodoList[index].completed;
    if (checkbox.checked) {
      todo.className = 'completed';
      label.style.textDecoration = 'line-through';
    } else {
      todo.className = '';
      label.style.textDecoration = '';
    }

    var isChecked = checkbox.checked; //

    // add 'line-through' to the toggled todo and all nested todos.
      // method should be called on every li element, including those on deeper nested ul's.
    function toggleNested(todo, isChecked) {
      var view = todo.childNodes[0];
      var checkbox = view.childNodes[1];
      // checkbox.checked = isChecked;
      var label = view.childNodes[2];
      // change DOM
      checkbox.checked = !checkbox.checked;
      if (checkbox.checked) {
        label.style.textDecoration = 'line-through';
      } else {
        label.style.textDecoration = '';
      }
      var nestedUl = todo.childNodes[2];
      if (nestedUl) {
        var nestedTodoList = nestedUl.childNodes;
        nestedTodoList.forEach(function(el) {
          toggleNested(el);
        });
      }
    }
    var nestedUl = todo.childNodes[2];
    if (nestedUl) {
      var nestedTodoList = nestedUl.childNodes;
      nestedTodoList.forEach(function(el) {
        toggleNested(el);
      });
    }
    helpers.store('todo-list', this.todoList);
  },
  clearCompleted: function clearCompleted(todoList) {
    // start with the un-nested todos.
    for (var i = todoList.length - 1; i >= 0; i--) {
		if (todoList[i].completed) {
		    todoList.splice(i, 1);
	    }
    }
    // clear completed nested todos => recursion.
    for (var i = todoList.length - 1; i >= 0; i--) {
      if (Array.isArray(todoList[i].nestedTodos)) {
        clearCompleted(todoList[i].nestedTodos);
      }
    }
    helpers.store('todo-list', App.todoList);
    // re-render.
    var todoListUl = document.getElementById('todo-list');
    App.renderTodoList(App.todoList, todoListUl);
  },
  clearAllTodos: function() {
     // Remove all nodes from the todoList ul.
    var todoList = document.getElementById('todo-list');
    while (todoList.firstChild) {
      todoList.removeChild(todoList.firstChild);
    }
    // update App.todoList
    var todoList = document.getElementById('todo-list');
    this.todoList = [];
    // store in local storage.
    helpers.store('todo-list', this.todoList);
    // re-render.
    var todoListUl = document.getElementById('todo-list');
    this.renderTodoList(this.todoList, todoListUl);
  },
  getParentElementByNodename: function getParentElementByNodename(nodeName, el) {
    // Recursive method to find the parent el.
    if (el.nodeName === nodeName) {
      // base case
      return el;
    } else {
      return getParentElementByNodename(nodeName, el.parentElement);
    }
  },
  getChildElementByNodeName: function getChildElementByNodeName(nodeName, el) {
    if (el.nodeName === nodeName) {
      return el;
    } else {
      return getChildElementByNodeName(nodeName, el.firstChild);
    }
  },
  getTodoListNodeById: function (todoListUl, id) {
    for (var i = 0; i < todoListUl.childNodes.length; i++) {
      if (todoListUl.childNodes[i].id === id) {
        return todoListUl.childNodes[i];
      }
    }
  },
  createNestedInputBox: function(parentLi) {
    var nestedInput;
    // create only one nestedInput box per li.
    for (var i = 0; i < parentLi.childNodes.length; i++) {
      if (parentLi.childNodes[i].className === 'nested') {
        nestedInput = parentLi.childNodes[i];
      }
    }
    if (nestedInput === undefined) {
      nestedInput = document.createElement('input');
    }
    nestedInput.id = 'nested';
    nestedInput.className = parentLi.id;
    nestedInput.placeholder = 'Build Your Nest'
    parentLi.appendChild(nestedInput);
    document.getElementById('nested').focus();
  },
  getParentTodolistArray: function(todo) {
    // return the parent todoList array of any todo on a todoList object.
    var todoList = App.todoList;
    var parentTodoList;
    // recursive to include all layers of nesting.
    function getNestedParentTodolistArray(todoList, todo) {
      for (var i = 0; i < todoList.length; i++) {
        // start with the un-nested todoList.
        if (todoList[i].id === todo.id) {
          parentTodoList = todoList;
        }
      }
      // check nested lists.
      if (parentTodoList === undefined) {
        todoList.forEach(function(el) {
          if (Array.isArray(el.nestedTodos)) {
            return getNestedParentTodolistArray(el.nestedTodos, todo);
          }
        })
      }
      return parentTodoList;
    }
    return getNestedParentTodolistArray(todoList, todo)
  }, 
  renderTodoList: function(todoList) {
    function clearDomTodoList() {
      var todoListUl = document.getElementById('todo-list');
      var domTodoList = todoListUl.childNodes;
      var i = domTodoList.length;
      while (i--) {  
        App.clearTodoLi(todoListUl.childNodes[i], todoListUl);
      }
    }
    clearDomTodoList();

    // start by rendering the non-nested todos, then render nestedTodos.
    todoListUl = document.getElementById('todo-list');
    todoList.forEach(function (todo) {
      App.createTodoLi(todo, todoListUl);
    })
    // recursive method to render all layers of nested todos.
    function renderNestedTodos(todoList, todoListUl) {
      for (var i = 0; i < todoList.length; i++) {
        var nestedTodoList = todoList[i].nestedTodos; // access the nestedTodos array, if it exists.
        var todoNode = App.getTodoListNodeById(todoListUl, todoList[i].id); // access each li on the root todo-list.
        if (Array.isArray(nestedTodoList)) {
          var nestedUl = App.createNestedUl(todoNode);
          // recursion.
          for (var j = 0; j < nestedTodoList.length; j++) {
            var todo = nestedTodoList[j];
            App.createTodoLi(todo, nestedUl);
            if (Array.isArray(todo.nestedTodos)) {
              renderNestedTodos(nestedTodoList, nestedUl);
            }
          }
        } 
        // Base Case: if (!Array.isArray(nestedTodoList) => do nothing.
      }
    }
    renderNestedTodos(todoList, todoListUl);
  }
}
App.init();
