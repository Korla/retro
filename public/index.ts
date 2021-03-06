Vue.use(VueMdl.default)
var app = new Vue({
  components: VueMdl.components,
  directives: VueMdl.directives,
  el: '#app',
  data: {
    exporting: false,
    initialized: false,
    newOpinion: {
      text: '',
      value: true
    },
    unpublishedOpinions: [],
    publishedOpinions: [],
    votes: {}
  },
  watch: {
    unpublishedOpinions: {
      deep: true,
      handler: function() {
        localStorage.setItem('unpublishedOpinions', JSON.stringify(this.unpublishedOpinions));
      }
    }
  },
  attached: function() {
    window.setTimeout(() => this.initialized = true);
    this.unpublishedOpinions = JSON.parse(localStorage.getItem('unpublishedOpinions')) || [];
  },
  init: function() {
    var config = {
      apiKey: "AIzaSyD03ggT9NXR-iY2o2WXmdu0GEmtTMJu8WY",
      authDomain: "retro-976fa.firebaseapp.com",
      databaseURL: "https://retro-976fa.firebaseio.com",
    };
    firebase.initializeApp(config);
    this.db = {
      opinions: firebase.database().ref('opinions'),
      votes: firebase.database().ref('votes')
    }
    this.db.opinions.on('child_added', data => {
      this.publishedOpinions.push(data.val());
      Vue.set(this.votes, data.key, this.votes[data.key] || 0);
    });
    this.db.opinions.on('child_changed', data => {
      var opinion = data.val();
      var index = this.publishedOpinions.findIndex(o => o.key === opinion.key);
      this.publishedOpinions[index] = opinion;
    });
    this.db.opinions.on('child_removed', data => {
      var opinion = data.val();
      var index = this.publishedOpinions.findIndex(o => o.key === opinion.key);
      this.publishedOpinions.splice(index, 1);
    });
    this.db.votes.on('child_added', data => {
      var vote = data.val();
      Vue.set(this.votes, vote.opinionKey, this.votes[vote.opinionKey] || 0);
      this.votes[vote.opinionKey] += vote.delta;
    });
  },
  ready: function() {
    this.$els.newOpinionElement.focus();
  },
  methods: {
    add: function() {
      if(!this.newOpinion.text) return;
      this.unpublishedOpinions.push(this.newOpinion);
      this.clear();
      this.$els.newOpinionElement.focus();
    },
    clear: function() {
      this.newOpinion = {
        text: '',
        value: true
      };
    },
    toggle: function(opinion) {
      opinion.value = !opinion.value;
    },
    publish: function(opinionToPublish) {
      var newOpinion = this.db.opinions.push();
      opinionToPublish.key = newOpinion.key;
      newOpinion.set(opinionToPublish);
      this.removeFromUnpublished(opinionToPublish);
    },
    removeFromUnpublished: function(opinionToPublish) {
      return this.unpublishedOpinions.splice(this.unpublishedOpinions.indexOf(opinionToPublish), 1)[0];
    },
    vote: function(opinion, delta) {
      var newVote = this.db.votes.push();
      newVote.set({delta, opinionKey: opinion.key});
    },
    removeDb: function(opinion) {
      this.db.opinions.child(opinion.key).remove();
    },
    exportToClipboard: function() {
      var newLine = '\n';
      var indentation = ' ';
      var extractRowData = o => ([
        o.text,
        '(' + this.votes[o.key] + ')'
      ]);

      var output = this.publishedOpinions
        .map(opinion => ({
          category: opinion.value ? 'Positive' : 'Negative',
          data: extractRowData(opinion).join(indentation)
        }))
        .reduce((prev, {category, data}) => {
          prev[category] = prev[category] || [];
          prev[category].push(data);
          return prev;
        }, {});
      var text = Object.keys(output)
        .map(category => {
          var value = output[category]
          let result = category + newLine;
          result += value.join(newLine);
          return result;
        }, '')
        .join(newLine);

      this.$els.exportElement.textContent = text;
      this.$els.exportElement.select();

      document.execCommand('copy');
    }
  }
});
