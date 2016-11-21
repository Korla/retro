var config = {
  apiKey: "AIzaSyD03ggT9NXR-iY2o2WXmdu0GEmtTMJu8WY",
  authDomain: "retro-976fa.firebaseapp.com",
  databaseURL: "https://retro-976fa.firebaseio.com",
};
firebase.initializeApp(config);
let dbRef = firebase.database().ref('db');

Vue.use(VueMdl.default)
var app = new Vue({
  components: VueMdl.components,
  directives: VueMdl.directives,
  el: '#app',
  data: {
    initialized: false,
    opinions: [],
    newOpinion: {
      text: '',
      value: true,
      votes: 0
    },
    db: []
  },
  ready: function() {
    this.$els.newOpinionElement.focus();
  },
  methods: {
    add: function() {
      if(!this.newOpinion.text) return;
      this.opinions.push(this.newOpinion);
      this.clear();
      this.$els.newOpinionElement.focus();
    },
    clear: function() {
      this.newOpinion = {
        text: '',
        value: true,
        votes: 0
      };
    },
    toggle: function() {
      this.newOpinion.value = !this.newOpinion.value;
    },
    publish: function(opinion) {
      this.db.push(this.remove(opinion));
      dbRef.set(this.db);
    },
    remove: function(opinion) {
      return this.opinions.splice(this.opinions.indexOf(opinion), 1)[0];
    },
    vote: function(opinion) {
      opinion.votes++;
      dbRef.set(this.db);
    },
    reset: function() {
      dbRef.set([]);
    },
  }
});

dbRef.on('value', data => {
  app.initialized = true;
  app.db = data.val() || [];
});
