if ('speechSynthesis' in window) {
    console.log("speech synthesis");
} else {
    console.log("no speech synthesis");
}

speechSynthesis.cancel();
var voices = [];
//var voices = speechSynthesis.getVoices();
//console.log(voices.length);
//voices.forEach(function(voice, i) {
//    console.log(voice.name);
//});

setTimeout(() => {
    voices = speechSynthesis.getVoices();
    voices.forEach(function(voice, i) {
          console.log(voice.name);
    });
}, 60);

window.addEventListener('load', function() {
	localStorage.setItem('word-version', 1);

	var words = [];
	var errors = [];
	var showed_words = [];
	var current_word_no;
	var current_audio_no;

	//fetch('words.json')
	//	.then(response => response.json())
	//	.then(function (json) {
	//		words = json;
	//		words.forEach((w, i) => w.index = i);
	//		var _errors = localStorage.getItem('errors');
	//		if (!_errors)
	//			localStorage.setItem('errors', '');

	//		errors = (_errors || '').split(',')
	//			.map((w) => words.find((e) => e.word == w))
	//			.filter((e) => !!e);

	//		$('#page-start #loading').remove();
	//		initOptions();
	//	});

	var $word = $('#page-main #word');
	var $input = $('#page-main #input');
	var $debug = $('#page-main #debug');
	var $explain = $('#page-main #button-start');

	//$('#page-start #button-start').addEventListener('click', () => setPage('main') || setWord());
        var $word_decks= $('#page-start #word-decks');
        var cols = 10;
        for (var i=0; i<25; i++) {
            var $de = document.createElement('tr');
            var $tds = "";
            for (var j=0; j<cols; j++) {
                deck_num = i*cols+j;
                $tds += '<td id="d'+deck_num+'"><div id="button-deck" data-deck="'+deck_num+'">D. '+deck_num+'</div></td>';
            }
            $de.innerHTML = $tds;
            $word_decks.appendChild($de);
        }

        var n = 250; //XXX if diff from cols X rows, input will not work.
        var arr = [];
        for (var i=0; i<n; i++) {
            var $ele = $('#d' + i + ' #button-deck');
	    $ele.addEventListener('click', function () {
                var count = this.getAttribute('data-deck');
                words = []
                loadWords(count);

                setPage('main');
                setTimeout(() => {
                    setWord();
                }, 160);
            });
        }
	$('#page-main #button-help').addEventListener('click', () => setPage('help'));
	$('.close', $e => $e.addEventListener('click', () => setPage($e.getAttribute('back'))));

	$('#page-main #button-option').addEventListener('click', function () {
		$('#page-option').setAttribute('prev', 10 * getOption('word-length') + getOption('word-popularity')); 
		setPage('option');
	});
	$('#page-option #button-option-close').addEventListener('click', function () {
		$('#page-main #word').setAttribute('hide-boxes', getOption('hide-boxes'));
		if ($('#page-option').getAttribute('prev') != 10 * getOption('word-length') + getOption('word-popularity'))
			setWord();
	});

	var dictionaries = {
		webster: 'https://www.merriam-webster.com/dictionary/',
		cambridge: 'https://dictionary.cambridge.org/dictionary/english/',
		google: 'https://translate.google.com/#en/'+ (navigator.language || navigator.userLanguage).substr(0, 2) + '/',
		macmillan: 'https://www.macmillandictionary.com/dictionary/british/',
		oxford: 'https://en.oxforddictionaries.com/definition/',
		farlex: 'https://www.thefreedictionary.com/'
	}

	$('#page-main #button-bookmarks').addEventListener('click', function () {
		var bookmarks = (localStorage.getItem('bookmarks') || '').split(',').filter(b => !!b);
		var $bookmarks = $('#page-bookmarks #bookmarks');
		$bookmarks.innerHTML = '';
		var dict = getOption('dictionary');

		bookmarks.forEach(function (bookmark) {
			var word = words.find(w => w.word == bookmark);
			if (!word)
				return;

			var $e = document.createElement('tr');
			$e.innerHTML = '<td><div>i</div></td><td>' + bookmark + '</td><td>&#10006;</td>';
			$e.children[0].onclick = () => window.open(dictionaries[dict] + bookmark);
			$e.children[1].onclick = function () {
				var audio_no = +this.getAttribute('audio-no') || 0;
				//play(word.audio[audio_no].url);
                                speakExt(word.word, 1.0);
				this.setAttribute('audio-no', (audio_no + 1) % word.audio.length);
			} 
			$e.children[2].onclick = () => removeBookmark(bookmark) || $e.remove(); 

			$bookmarks.appendChild($e);
		})
		setPage('bookmarks');
	});

	function addBookmark() {
		var word = words[current_word_no].word;

		var $e = $('#page-main #button-bookmarks');
		$e.setAttribute('animation', true);
		setTimeout(() => $e.removeAttribute('animation'), 1000);

		var bookmarks = localStorage.getItem('bookmarks') || '';
		if (bookmarks.split(',').indexOf(word) == -1)
			localStorage.setItem('bookmarks', bookmarks + ',' + word);
	}

	function removeBookmark(word) {
		var bookmarks = (localStorage.getItem('bookmarks') || '').split(',');
		if (bookmarks.indexOf(word) == -1)
			return;	

		localStorage.setItem('bookmarks', bookmarks.filter(w => w != word).join(','));
	}

	function initOptions() {
		$('#page-option .content > div', function ($opt) {	
			var opt = $opt.id;
			var $e = $('#' + opt);
			for(var i = 0; i < $e.children.length; i++)
				$e.children[i].addEventListener('click', (event) => setOption(opt, event.target.getAttribute('value')));
			setOption(opt, localStorage.getItem(opt));
		});
	}

	function setOption(opt, value) {
		var $e = $('#' + opt);
		var def = $e.getAttribute('default');
		localStorage.setItem(opt, value || def);
		for(var i = 0; i < $e.children.length; i++)
			$e.children[i].removeAttribute('current');

		var $curr = $e.querySelector('[value="' + value + '"]') || $e.querySelector('[value="' + def + '"]')
		$curr.setAttribute('current', true);
	}

	function getOption(opt) {
		var $e = $('#' + opt + ' [current]');
		return $e ? $e.getAttribute('value') : $('#' + opt).getAttribute('default');
	}

	function updateScore(delta) {
		$word.setAttribute('score', +$word.getAttribute('score') + delta);
	}

	var kb_nearest = {
		q: 'aw', a: 'qwsz', z: 'asx', 
		w: 'qase', s: 'wazxde', x: 'zsdc',	
		e: 'wsdr', d: 'serfcx', c: 'xdfv',
		r: 'edft', f: 'rtgvcd', v: 'cfgb',
		t: 'rfgy', g: 'tyhbvf', b: 'vghn',
		y: 'tghu', h: 'yujnbg', n: 'bhjm',
		u: 'yhji', j: 'uikmnh', m: 'njk,',
		i: 'ujko', k: 'iol,mj', 
		o: 'iklp', l: 'op;.,k', p:'ol;[]' 
	}

	$word.addEventListener('click', addBookmark);

	setInterval(() => $input.focus(), 10);
	$input.addEventListener('keydown', (event) => (event.keyCode == 13) ? updateScore(-10) || addBookmark() || setWord() : null);
	$input.addEventListener('input', function (event) {
		var char = (this.value || '').slice(-1);
		this.value = '';
		event.stopImmediatePropagation();

		$debug.innerHTML = '';
		var word = words[current_word_no];

		if (char == ' ' || char == '') {
			//current_audio_no = (current_audio_no + 1) % word.audio.length;
			//play(word.audio[current_audio_no].url);
                        speakExt(word.word, 1.0);
		        $explain.innerHTML = word.explain;
			return false;
		}

		if (!char.match(/[a-z]/i))
			return $debug.innerHTML = 'Incorrect key: ' + char;

		var $e = $word.querySelector(':not([correct])');
		if (!$e)
			return false;

		$e.setAttribute('char', char); 
		var ignore_mistprints = getOption('ignore-misprints') == 'yes';
		var require_char = $e.textContent.toLowerCase();
		$e.setAttribute('correct', require_char == char || ignore_mistprints && kb_nearest[require_char].indexOf(char) != -1);

		if (!$word.querySelector(':not([correct])')) {
			//play(word.audio[current_audio_no].url);
                        speakExt(word.word, 1.0);
			showed_words.push(word.word);
			var error_count = $word.querySelectorAll('[correct="false"]').length;
			updateScore(error_count ? -Math.pow(2, error_count) : word.word.length);

			if (error_count) {
				localStorage.setItem('errors', localStorage.getItem('errors') + ',' + word.word);
				addBookmark();
			}

			setTimeout(setWord, 2000);
		}
	})

	function setWord () {
		$input.value = '';
		$debug.innerHTML = '';
		current_audio_no = 0;

		var length = getOption('word-length');
		var popularity = getOption('word-popularity');
		var min = [0, 0, 1000, 4000, 0][popularity];
		var max = [0, 1000, 4000, words.length, words.length][popularity];

		function filter(arr) {
			return arr
				.filter((w) => w.index > min && w.index < max)
				.filter((w) => showed_words.indexOf(w.word) == -1)
				.filter((w) => length == 1 && w.word.length < 6 || length == 2 && (w.word.length > 5 && w.word.length < 10) || length == 3 && w.word.length > 9 || length == 4)	
		}

		function filter1(arr) {
			return arr
				.filter((w) => showed_words.indexOf(w.word) == -1)
                }
		console.log("set word: " + words.length);
                _words = filter1(words)
		//var _words = Math.random() < 0.3 ? filter(errors) : [];
		//if (!_words.length)
		//	_words = filter(words);
		
		if (!_words.length)	
			return alert('Well done! No more words!')

		var word = _words[Math.floor(Math.random() * _words.length)];
		current_word_no = word.index;
		//play(word.audio[current_audio_no].url);
                speakExt(word.word, 1.0);

		var error_index = errors.indexOf(word);
		
		if (error_index != -1) {
			errors.splice(error_index, 1);
			localStorage.setItem('errors', localStorage.getItem('errors').split(',').filter((w) => w != word.word).join(','));
		}

		$word.innerHTML = '';
		var uw = word.word.toUpperCase();
		for(var i = 0; i < uw.length; i++) {
			var $e = document.createElement('div');
			$e.innerHTML = uw[i];
			$word.appendChild($e);
		}
		
		$word.setAttribute('hide-boxes', 'no');
		$word.setAttribute('density', 0);
		if ($word.offsetWidth > $word.parentElement.offsetWidth)
			$word.setAttribute('density', 1);
		if ($word.offsetWidth > $word.parentElement.offsetWidth)
			$word.setAttribute('density', 2);
		if ($word.offsetWidth > $word.parentElement.offsetWidth)
			$word.setAttribute('density', 3);
		
		$word.setAttribute('hide-boxes', getOption('hide-boxes'));
	}

	function play(url) {
		//var audio = new Audio(url);
		//audio.oncanplay = () => audio.play();
		//audio.onended = () => audio = undefined;
		//audio.onerror = (err) => $debug.innerHTML = err.message;
	}

	function setPage(page) {
		$('.page', $e => $e.removeAttribute('current'));
		$('#page-' + page).setAttribute('current', true);
	}

	history.pushState({}, '', window.location.pathname);
	window.addEventListener('popstate', function(event) {
		var page = $('.page[current]');
		if (page.id == 'page-start')
			return history.back();

		history.pushState(null, null, window.location.pathname);
		if (page.id == 'page-main')
			return setPage('start');

		page.querySelector('.close').click();
	}, false);

	function $ (selector, apply) {
		return apply ? Array.prototype.slice.call(document.querySelectorAll(selector) || []).forEach(apply) : document.querySelector(selector);
	}

function loadWords(deck) {
	fetch('decks/deck-' + deck + '.json')
		.then(response => response.json())
		.then(function (json) {
			words = json;
			console.log("load words: " + words.length);
			words.forEach((w, i) => w.index = i);
			var _errors = localStorage.getItem('errors');
			if (!_errors)
				localStorage.setItem('errors', '');

			errors = (_errors || '').split(',')
				.map((w) => words.find((e) => e.word == w))
				.filter((e) => !!e);

			$('#page-start #loading').remove();
			initOptions();
		});
}
});

// Create a new utterance for the specified text and add it to
// the queue.
function speakExt(text, rate) {
  // Create a new instance of SpeechSynthesisUtterance.
  var msg = new SpeechSynthesisUtterance();

  // Set the text.
  msg.text = text;

  // Set the attributes.
  msg.volume = 1.0;
  msg.rate = 1.0;
  msg.pitch = 1.0;

  // If a voice has been selected, find the voice and set the
  // utterance instance's voice attribute.
  //if (voiceSelect.value) {
    //msg.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == voiceSelect.value; })[0];
  //}
  msg.voice = voices[19]

  console.log(msg)
  // Queue this utterance.
  window.speechSynthesis.speak(msg);
}
