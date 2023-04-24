// Prompt Maker 5000
// Copyright (c) 2023 by Brian Risinger

const pm5regexlh = /^([^<]*(?:<(?=lora:|hypernet:)[^<]+)*)<(?!lora:|hypernet:)([^>]*)>(.*)$/;
// /^((?:[^<]+|<(?=lora:|hypernet:))*)<([^>]*)>(.*)$/;
const pm5regex = /^([^<]*)<([^>]*)>(.*)$/;
// old, not actually correct (only works if lora / hypernet is at the end  /^([^<]*)<(?!lora:|hypernet:)([^>]*)>(.*)$/;

const pm5regexFindLH = /<((?:lora:|hypernet:)[^<]+)>/g;

const pm5weightregex = /^(\d+):(.*)$/;

const LIST_TOO_BIG = 250000;

var wordlistcount = 0;

var tributeData = {};
var tribute = null;

function pm5Open(){
	var pm5 = document.getElementById("promptmaker");
	if(pm5 != null){
		pm5.classList.add("open");
	}
}

function pm5Close(){
	var pm5 = document.getElementById("promptmaker");
	if(pm5 != null){
		pm5.classList.remove("open");
	}
}

function pm5Load(){
	
	document.getElementById("close").addEventListener("click",closeResults);
	document.getElementById("pm5addprompt").addEventListener("click",pm5AddPrompt);
	document.getElementById("pm5addwl").addEventListener("click",pm5NewWordList);
	document.getElementById("pm5generate").addEventListener("click",pm5Generate);
	document.getElementById("pm5generateall").addEventListener("click",pm5GenerateAll2);
	document.getElementById("pm5wlcontainer").addEventListener("click",pm5WordListExpand);
	document.getElementById("pm5save").addEventListener("click",pm5Save);
	document.getElementById("pm5loadshow").addEventListener("click",pm5LoadShow);
	document.getElementById("pm5load").addEventListener("click",pm5LoadButton);
	document.getElementById("pm5showcounts").addEventListener("click",pm5ShowCounts);
	document.getElementById("pm5prompt").addEventListener("change",pm5PromptChange);
	document.getElementById("pm5imageholder").addEventListener("click",pm5ImageExpand);
	//document.getElementById("pm5promptimage").addEventListener("click",pm5ImageExpand);
	document.getElementById("pm5addeditprompt").addEventListener("click",pm5AddEditPrompt);
	document.getElementById("pm5addpromptclose").addEventListener("click",pm5AddEditPromptClose);
	document.getElementById("pm5addeditselect").addEventListener("change",pm5AddEditPromptChange);
	document.getElementById("pm5darkmode").addEventListener("change",pm5DarkMode);
	document.getElementById("pm5wlsort").addEventListener("change",pm5WLSort);
	document.getElementById("pm5addoptions").addEventListener("click",pm5AddPromptOptions);
	document.getElementById("pm5promptoptionsreplace").addEventListener("click",pm5PromptOptionReplace);
	document.getElementById("pm5promptoptionsskip").addEventListener("click",pm5PromptOptionSkip);
	document.getElementById("pm5promptoptionsquit").addEventListener("click",pm5PromptOptionQuit);
	document.getElementById("pm5promtoptionselect").addEventListener("change",pm5PromptOptionSelectChange);
	document.getElementById("pm5newprompt").addEventListener("scroll",pm5NewPromptScroll);
	
	
	
	const req = new XMLHttpRequest();
	req.addEventListener("load", reqListenerpm5);
	req.addEventListener("error", reqFailpm5);
	req.open("GET", "./pm5000library.json");
	req.send();



	
	
	pm5UpdateTribute();
}

function pm5DarkMode(){
	var ele = document.getElementById("pm5darkmode");
	if(ele!=null){
		var val = ele.checked;
		window.localStorage.setItem("darkmode",val);
		
		if(val){
			document.body.classList.add("darkmode");
		}else{
			document.body.classList.remove("darkmode");
		}
	}
}

function pm5ImageExpand(e){
	var ele=document.getElementById("pm5imageholder");
	if(ele!=null){
		if(ele.classList.contains("imgexpand")){
			ele.classList.remove("imgexpand");
		}else{
			ele.classList.add("imgexpand");
		}
	}
	e.stopPropagation();
}

function reqListenerpm5() {
	var pm5Data = {"prompts" : [], "wordlists" : {}};

	try{
		var pm5Data = JSON.parse(this.responseText);
	}catch(e){
		console.error(e);
		alert("Error parsing Prompt Maker Library (using default data): "+e.message);
		pm5Data = PromptMakerLibraryBackup;
	}
	
	pm5FillPrompts(pm5Data.prompts);
	
	pm5FillWordLists(pm5Data.wordlists);
	
	pm5PromptChange();
	
	pm5UpdateTribute();
}

function reqFailpm5(evt){
	//alert("Failed to load prompt library - using default");
	var obj = { "responseText": PromptMakerLibraryBackup };
	reqListenerpm5.apply(obj);
}

function pm5FillPrompts(prompts){
	var sel = document.getElementById("pm5prompt");
	if(sel!=null){
		var children = document.createDocumentFragment();
		for(var promptdata of prompts){
			children.appendChild(pm5PromptOption(promptdata.name,promptdata.value,promptdata.neg,promptdata.tips,promptdata.credit,promptdata.image));
		}
		sel.replaceChildren(...children.childNodes);
	}
}

function pm5FillWordLists(wordlists){
	var wlcont = document.getElementById("pm5wlcontainer");
	var wltemplate = document.getElementById("pm5basewl");
	if(wlcont!=null && wltemplate!=null){
		wordlistcount = 0;
		var children = document.createDocumentFragment();
		for(var wlkey in wordlists){
			children.appendChild(pm5AddWordList(wlkey,wordlists[wlkey]));
		}
		wlcont.replaceChildren(...children.childNodes);
	}
}

function pm5AddWordList(name, content){
	name = name.trim();
	var wltemplate = document.getElementById("pm5basewl");
	if(wltemplate!=null){
		var ele = wltemplate.cloneNode(true);
		ele.id="";
		
		allDescendants(ele,function(ele){ 
			if(ele.id != null && ele.id.length > 0){
				ele.id = ele.id + name;
				if(ele.tagName.toLowerCase() != "textarea"){
					ele.setAttribute("origorder",wordlistcount);
					wordlistcount++;
				}
			}
			if(ele.innerText == "Title"){
				ele.innerText = name;
			}
			if(ele.tagName != null && ele.tagName.toLowerCase() == "textarea"){
				ele.value = content;
			}
		});
		return ele.firstElementChild;
	}
	return null;
}

function pm5NewWordList(){
	var pm5newwl = document.getElementById("pm5newwl");
	var wlcont = document.getElementById("pm5wlcontainer");
	var ele = null;
	if(pm5newwl != null && wlcont != null){
		var name = pm5newwl.value;
		if(document.getElementById("pm5wl-"+name) != null){
			alert("Word List "+name+" already exists.");
			return;
		}
		
		pm5newwl.value = "";
		ele = pm5AddWordList(name,"");
		wlcont.appendChild(ele);
		ele.scrollIntoView();
		
		pm5UpdateTribute();
	}
}


function allDescendants (node, funct) {
    for (var i = 0; i < node.childNodes.length; i++) {
      var child = node.childNodes[i];
      allDescendants(child,funct);
      funct(child);
    }
}

function pm5AddEditPrompt(){
	var ele = document.getElementById("pm5makeprompt");
	if(ele != null){
		ele.classList.add("open");
	}
	
	//copy prompts to edit select
	var sel = document.getElementById("pm5prompt");
	var editsel = document.getElementById("pm5addeditselect");
	if(sel!=null && editsel!=null){
		editsel.options.length = 0;
		var opt = document.createElement("option");
		opt.name = opt.value = opt.innerText = "New Prompt";
		editsel.appendChild(opt);
		
		var opts = sel.getElementsByTagName("option");
		for(var ele of opts){
			opt = document.createElement("option");
			opt.setAttribute("pm5name",ele.getAttribute("pm5name"));
			opt.value = ele.value;
			opt.setAttribute("neg",ele.getAttribute("neg"));
			opt.setAttribute("tips",ele.getAttribute("tips"));
			opt.setAttribute("credit",ele.getAttribute("credit"));
			opt.setAttribute("image",ele.getAttribute("image"));
			opt.innerText = ele.innerText;
			//we ignore the disabled parameter as we want user to be able to edit those as well
			editsel.appendChild(opt);
		}
	}
}

function pm5AddEditPromptClose(){
	var ele = document.getElementById("pm5makeprompt");
	if(ele != null){
		ele.classList.remove("open");
	}
	
	//copy prompts back to main select
	var sel = document.getElementById("pm5prompt");
	var editsel = document.getElementById("pm5addeditselect");
	if(sel!=null && editsel!=null){
		var opt = null;
		var first = true;
		sel.options.length = 0;
		
		var opts = editsel.getElementsByTagName("option");
		for(var ele of opts){
			//skip new prompt
			if(first){
				first = false;
				continue;
			}
			opt = document.createElement("option");
			opt.setAttribute("pm5name",ele.getAttribute("pm5name"));
			opt.value = ele.value;
			opt.setAttribute("neg",ele.getAttribute("neg"));
			opt.setAttribute("tips",ele.getAttribute("tips"));
			opt.setAttribute("credit",ele.getAttribute("credit"));
			opt.setAttribute("image",ele.getAttribute("image"));
			opt.innerText = ele.innerText;
			if(opt.value == null || opt.value.length<1){
				opt.disabled = true;
			}
			sel.appendChild(opt);
		}
		
		pm5UpdateTribute();
	}
}

function pm5AddPrompt(){
	var editsel = document.getElementById("pm5addeditselect");
	var newprompt = document.getElementById("pm5newprompt");
	var newprompttitle = document.getElementById("pm5newprompttitle");
	var newpromptneg = document.getElementById("pm5newpromptneg");
	var newprompttips = document.getElementById("pm5newprompttips");
	var newpromptcredit = document.getElementById("pm5newpromptcredit");
	var newpromptimage = document.getElementById("pm5newpromptimage");
	if(editsel!=null && 
		newprompt!=null && 
		newprompttitle!=null && newprompttitle.value.trim().length > 0 &&
		newpromptneg!=null && 
		newprompttips!=null && 
		newpromptcredit!=null && 
		newpromptimage!=null 
		){
		var name = newprompttitle.value.trim();
		var value = newprompt.value.trim();
		var neg = newpromptneg.value.trim();
		var tips = newprompttips.value.trim();
		var credit = newpromptcredit.value.trim();
		var image = newpromptimage.value.trim();

		if(editsel.selectedIndex == 0) {
			editsel.appendChild(pm5PromptOption(name,value,neg,tips,credit,image));
			editsel.options[editsel.options.length-1].disabled = false;
		} else {
			var opt = editsel.options[editsel.selectedIndex];
			var ele = pm5PromptOption(name,value,neg,tips,credit,image);
			opt.setAttribute("pm5name",ele.getAttribute("pm5name"));
			opt.value = ele.value;
			opt.setAttribute("neg",ele.getAttribute("neg"));
			opt.setAttribute("tips",ele.getAttribute("tips"));
			opt.setAttribute("credit",ele.getAttribute("credit"));
			opt.setAttribute("image",ele.getAttribute("image"));
			opt.innerText = ele.innerText;
		}
		
		newprompt.value = "";
		newprompttitle.value = "";
		newpromptneg.value = "";
		newprompttips.value = "";
		newpromptcredit.value = "";
		newpromptimage.value = "";
	}else{
		if(newprompttitle.value.trim().length > 0){
			alert("Please specify a title");
		}else{
			alert("Error adding prompt");
		}
	}
	
}

function pm5PromptOption(name,value,neg,tips,credit,image){
	var opt = document.createElement("option");
	opt.value = value;
	opt.setAttribute("pm5name",name);
	if(neg!=null){
		opt.setAttribute("neg",neg);
	}
	if(tips!=null){
		opt.setAttribute("tips",tips);
	}
	if(credit!=null){
		opt.setAttribute("credit",credit);
	}
	if(image!=null){
		opt.setAttribute("image",image);
	}
	if(value == ""){
		opt.disabled = true;
		if(name == ""){
			opt.innerText = "──────────";
		} else {
			opt.innerText = "─── " + name + " ───────";
		}
	}else{
		opt.innerText = name + " - " +value;
	}
	return opt;
}

function pm5AddEditPromptChange(){
	var editsel = document.getElementById("pm5addeditselect");
	var newprompt = document.getElementById("pm5newprompt");
	var newprompttitle = document.getElementById("pm5newprompttitle");
	var newpromptneg = document.getElementById("pm5newpromptneg");
	var newprompttips = document.getElementById("pm5newprompttips");
	var newpromptcredit = document.getElementById("pm5newpromptcredit");
	var newpromptimage = document.getElementById("pm5newpromptimage");
	
	var opt = editsel.options[editsel.selectedIndex];
	newprompttitle.value = opt.getAttribute("pm5name")=="null"?"":opt.getAttribute("pm5name");
	newprompt.value = opt.value=="null"?"":opt.value;
	newpromptneg.value = opt.getAttribute("neg")=="null"?"":opt.getAttribute("neg");
	newprompttips.value = opt.getAttribute("tips")=="null"?"":opt.getAttribute("tips");
	newpromptcredit.value = opt.getAttribute("credit")=="null"?"":opt.getAttribute("credit");
	newpromptimage.value = opt.getAttribute("image")=="null"?"":opt.getAttribute("image");
}

var promptoptions = null;
function pm5AddPromptOptions(){
	//disable button
	document.getElementById("pm5addoptions").disabled = true;
	
	promptoptions = {};
	promptoptions.allmatches = new Array();
	//promptoptions.worddata = {};
	promptoptions.wordlistregex = {};
	promptoptions.current = 0;
	promptoptions.curstart = 0;
	
	const pm5Data = pm5GetData();
	//override user settings to get list we want no duplicates, immediate list only (we will go a level deep here making regex more efficient)
	pm5Data.EqualProbability = false;
	pm5Data.NoDuplicates = true;
	//disable prompt textarea
	const prompt = document.getElementById("pm5newprompt");
	prompt.readOnly = true;
	
	//set up for highlighting
	const highlightcontainer = document.getElementById("highlightcontainer");
	const highlights = document.getElementById("highlights");
	const backdrop = document.getElementById("backdrop");
	highlightcontainer.style.width = (prompt.clientWidth + 17) +"px"; //not sure why the 17 is needed, but backdrop is visibly narrower if just client width is used (can see different background color on right edge (in dark mode))
	backdrop.style.width = prompt.clientWidth +"px"; 
	backdrop.style.height = prompt.clientHeight + "px";
	highlights.innerHTML = applyHighlights(prompt.value,0,0);
	pm5NewPromptScroll();
	
	//set busy
	document.body.classList.add("busy");
	
	//ok, we are going to make a list of all words/phrases that are parts of word lists mapped to the word lists that contain them
	for(const wlkey in pm5Data.wordlists){
		var list = pm5GetWordListWords(pm5Data,wlkey);
		var rex = "";

		for(var word of list){
			
			//remove weight if there
			var m = word.match(pm5weightregex);
			if(m!=null){
				word = m[2];
			}
			
			if(word.length < 1)
				continue; //skip empty words
			if(word.indexOf("<") > -1){
				//expand replacement, but only one level
				var item = word;
				var match = pm5GetMatch(item);
				var result = "";
				while(match !=null){
					var sublistname = match[2];
					var sublist = pm5Data.wordlists[sublistname].split("\n");
					result += escapeRegExp(match[1])+"(?:";
					var added = false;
					for(var j = 0; j< sublist.length; j++){
						//remove weight if there
						m = sublist[j].match(pm5weightregex);
						if(m!=null){
							sublist[j] = m[2];
						}
						//add to regex OR
						if(sublist[j].indexOf('<')== -1 && sublist[j].length>0){ //don't add further nested word list references or empty string
							result += ((!added) ? "" : "|") + escapeRegExp(sublist[j]);
							added = true;
						}
					}
					if(!added){
						//all sublists of this sub-wordlist references further word lists, so don't add it
						result = "";
						break;
					}
					result += ")";
					if(pm5GetMatch(match[3])){
						item = match[3];
						match = pm5GetMatch(item);
					}else{
						result += escapeRegExp(match[3]);
						match = null;
					}
				}
				word = result.toLowerCase();

			} else {
				word = escapeRegExp(word);
			}
			
			if(word.length>0){
				rex += (rex.length>0 ? "|" : "") + word;
			}

		}
		
		if(rex.length > 0){
			//don't add regexes for lists that are too nested to have any words
			promptoptions.wordlistregex[wlkey] = rex;
		}
	}
	
	pm5FindNextPromptOption();
}

function makeMatchRecord(start, len, word){
	var obj = {};
	obj.start = start;
	obj.len = len;
	obj.word = word;
	return obj;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

//not used?
function regexIndexOf(string, regex, startpos) {
	//don't use a regex with capturing groups
	var match = string.substring(startpos || 0).match(regex);
	
    var indexOf = string.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}

function stringSorterLength(a,b){
	var val = b.length - a.length;
	if(val == 0){
		val = a.localeCompare(b);
	}
	return val;
}

function pm5FindNextPromptOption(){
	const prompt = document.getElementById("pm5newprompt").value;
	const pm5Data = pm5GetData();
	const respectWordBoundries = document.getElementById("pm5addoptionsrespectword").checked;
	
	//set busy
	document.body.classList.add("busy");
	
	while(promptoptions.current < pm5Data.wordlistcount){
		
		var wordlist = Object.keys(pm5Data.wordlists)[promptoptions.current];
		var regexstr = promptoptions.wordlistregex[wordlist];
		
		//find words from this wordlist in prompt
		if(respectWordBoundries){
			regexstr = "\\b(?:" + regexstr + ")\\b";
		}
		var regex = new RegExp(regexstr,'gi');
		regex.lastIndex = promptoptions.curstart;
		var match = regex.exec(prompt);

		if( match != null && match.length == 1){
			var length = match[0].length;
			var start = regex.lastIndex - length;
						
			//make sure not inside <>
			var open = prompt.lastIndexOf("<",start);
			var close = prompt.lastIndexOf(">",start);
			if(open > close){
				//don't look inside wordlist references
				promptoptions.curstart = regex.lastIndex;
				continue;
			}
			
			//make sure match has at least 1 alphanum character
			if(match[0].match(/\w|\d/) == null){
				promptoptions.curstart = regex.lastIndex;
				continue;
			}
			
			if(length < 3){
				//match must be at least three characters
				promptoptions.curstart = regex.lastIndex;
				continue;
			}
			
			//make sure we haven't found this match already
			var next = false;
			for(i = 0; i < promptoptions.allmatches.length; i++){
				var matchitem = promptoptions.allmatches[i];
				if(matchitem.start == start && matchitem.len == length && matchitem.word == match[0]){
					//found same match again, skip
					promptoptions.curstart = regex.lastIndex;
					next = true;
					break;;
				}
			}
			if(next) continue;
			
			//found matching word. Highlight in prompt. Open dialog asking to replace
			promptoptions.curstart = start;
			promptoptions.curlength = length;
			promptoptions.curmatch = match[0];
			promptoptions.allmatches.push(makeMatchRecord(start,length,match[0])); //add match record
			
			//var wordlists = [...promptoptions.worddata[word].lists.values()];
			var wordlists = pm5FindWordlists(pm5Data, match[0]);
			if(wordlists.length == 0){
				console.log("That shouldn't happen!");
			}
			const textarea = document.getElementById("pm5promptoptionwordlist");
			const select = document.getElementById("pm5promtoptionselect");
			const prompttextarea = document.getElementById("pm5newprompt");
			const promptoptionword = document.getElementById("pm5promptoptionword");
			
			//set up select
			//remove current options
			var i, L = select.options.length - 1;
			for(i = L; i > -1; i--) {
				select.remove(i);
			}
			//add new options
			for(i=0;i<wordlists.length;i++){
				var option = document.createElement("option");
				option.innerText = option.value = wordlists[i];
				select.appendChild(option);
			}
			select.disabled = wordlists.length < 2;
			
			//set up text area (pre-fill)
			textarea.disabled = true;
			pm5PromptOptionSelectChange();
			
			//show word to replace
			promptoptionword.innerText = match[0];
			
			//show dialog
			document.getElementById("pm5showpromptoptions").classList.add("open");
						
			//highlight words in prompt
			//prompttextarea.setSelectionRange(start, start + length);
			const highlights = document.getElementById("highlights");
			highlights.innerHTML = applyHighlights(prompt, start, start + length);
			
			//set not busy
			document.body.classList.remove("busy");
			
			//return, so we break out o fthis loop and let the user interact with the dialog (pressing a button will call this method again)
			return;
		}else{
			if(match!=null && match.length > 0 ){
				console.log("found match of bigger than 1: "+match);
			}
		}
		promptoptions.current++;
		promptoptions.curstart = 0;
	}
	
	pm5PromptOptionQuit();
	
	alert("No more replacement options found");
}

function applyHighlights(text, start, end){
	if(text==null) return "";
	text = text.substring(0,start) + "\x01" + text.substring(start,end) + "\x02" + text.substring(end);
	text = text.replace(/\n&/g, '\n\n');
	text = text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
	text = text.replace("\x01","<mark>").replace("\x02","</mark>");
	return text;
}

function pm5NewPromptScroll() {
	const prompt = document.getElementById("pm5newprompt");
	const backdrop = document.getElementById("backdrop");
	backdrop.scrollTop = prompt.scrollTop;
}

function pm5PromptOptionSelectChange(){
	const select = document.getElementById("pm5promtoptionselect");
	const textarea = document.getElementById("pm5promptoptionwordlist");
	const pm5Data = pm5GetData();
	
	const listname = select.options[select.selectedIndex].value;
	//textarea.value = pm5Data.wordlists[listname];
	textarea.value = pm5GetWordListWords(pm5Data,listname).join('\n');
	
}

function pm5PromptOptionReplace(){
	//replace word in prompt then continue search (continue as if we skipped)
	const select = document.getElementById("pm5promtoptionselect");
	var prompt = document.getElementById("pm5newprompt").value;
	const wordlist = select.options[select.selectedIndex].value;
	const start = promptoptions.curstart;
	const len = promptoptions.curlength;
	prompt = prompt.substring(0,start) + "<"+wordlist+">" + prompt.substring(start+len);
	document.getElementById("pm5newprompt").value = prompt;
	promptoptions.curstart += len + 1; //skip will add the additional 1 for the other angle bracket
	
	//adjust start position of matches found after start location of this match, as we adjusted the length of the string before the following matches
	var resize = (wordlist.length+2) - len;
	for(i = 0; i < promptoptions.allmatches.length; i++){
		var match = promptoptions.allmatches[i];
		if(match.start > start){
			match.start += resize;
		}
	}
	
	//close dialog and look for next matching word
	pm5PromptOptionSkip();
}

function pm5PromptOptionSkip(){
	//close option dialog, remove highlights, continue search from end of last match
	document.getElementById("pm5showpromptoptions").classList.remove("open");
	const highlights = document.getElementById("highlights");
	highlights.innerHTML = "";
	promptoptions.curstart++;
	pm5FindNextPromptOption();
}

function pm5PromptOptionQuit(){
	document.getElementById("pm5showpromptoptions").classList.remove("open");
	//remove highlights
	const highlights = document.getElementById("highlights");
	highlights.innerHTML = "";
	//re-enable button
	document.getElementById("pm5addoptions").disabled = false;
	promptoptions = null;
	//reset prompt text Area
	const promptele = document.getElementById("pm5newprompt");
	promptele.readOnly = false;
	//set not busy
	document.body.classList.remove("busy");
}

function pm5FindWordlists(pm5Data, word){
	//return an array of the names of the wordlists the specified word is in.
	var array = new Array();
	
	for(var i=0; i < pm5Data.wordlistcount; i++){
		
		var wordlist = Object.keys(pm5Data.wordlists)[i];
		var regexstr = promptoptions.wordlistregex[wordlist];
	
		regexstr = "^(?:" + regexstr + ")$";
		if(word.match(new RegExp(regexstr,"i")) != null){
			array.push(wordlist);
		}
	}
	return array;
}
	

function pm5GetMatch(prompt){
	if(prompt.indexOf("<lora:")>-1 || prompt.indexOf("<hypernet:")>-1){
		return prompt.match(pm5regexlh);//slower by a *LOT*
	}else{
		return prompt.match(pm5regex);
	}
}

function pm5Generate(){
	
	var pm5Data = pm5GetData();
	
	var prompt = "";
	var count = 1;
	var prompts = "";
	var sel = document.getElementById("pm5prompt");
	var num = document.getElementById("pm5count");
	if(sel!=null && num!=null){
		prompt = sel.options[sel.selectedIndex].value;
		count = num.value;
		
		for(var i=0;i<count;i++){
			try{
				pm5Data.data = {};
				prompts += pm5MakePrompt(pm5Data,prompt) + "\n";
			}catch(e){
				alert("No such  word list: "+e.message);
				return;
			}
		}
		
		var pm5result = document.getElementById("pm5result");
		
		prompts = pm5MakeResultsString(prompts);
		
		pm5result.value = prompts;
		pm5result.scrollTop=0;
		pm5result.scrollLeft = 0;
	}
}

function pm5MakeResultsString(prompts){
	var sel = document.getElementById("pm5prompt");
	var neg = sel.options[sel.selectedIndex].getAttribute("neg");
	var tips = sel.options[sel.selectedIndex].getAttribute("tips");
	var credit = sel.options[sel.selectedIndex].getAttribute("credit");
	if( (neg!=null && neg.length>0) || (tips!=null && tips.length>0) || (credit!=null && credit.length>0)){
		if(prompts != null && prompts.length > 0){
			prompts = "Prompts:\n"+prompts;
		}else{
			prompts = "";
		}
		if(sel!=null){
			var str = sel.options[sel.selectedIndex].value;
			if( str.indexOf("<lora:")>-1 || str.indexOf("<hypernet:")>-1 ){
				var matches = str.match(pm5regexFindLH);
				var buf = "Loras / Hypernets used:\n";
				for(var i=0;i<matches.length;i++){
					var temp = matches[i].substring(1,matches[i].length-1)
					var pos1 = temp.indexOf(":");
					var pos2 = temp.indexOf(":",pos1+1);
					if(pos2 > 0){
						temp = temp.substring(0,pos2);
					}
					buf += temp + "\n";
				}
				prompts = buf +"\n"+prompts;
			}
		}
		if(neg!=null && neg.length>0){
			prompts = "Negative Prompt: "+neg+"\n\n"+prompts;
		}
		if(tips!=null && tips.length>0){
			prompts = "Tips: "+tips+"\n\n"+prompts;
		}
		if(credit!=null && credit.length>0){
			prompts = "Credit: "+credit+"\n\n"+prompts;
		}
	}
	
	return prompts;
}



function pm5MakePrompt(data,prompt){
	
	//find first replace list
	var match = pm5GetMatch(prompt);
	while(match !=null){
		var listname = match[2];
		//find list
		var list = pm5GetWordListWords(data,listname);
		
		if(data.Force != null && data.Force == listname && data.ForceReplace != null){
			//replace this list with item specified by user
			prompt = match[1] + data.ForceReplace + match[3];
		}else if(data.ReplaceAll != null && data.ReplaceAll == listname){
			//replace this item with all items from list
			if(data.ReplaceAllSeparate){
			
				//if recursive, get the full list without duplicates
				if(data.ReplaceAllRecursive){
					var reallist = [];
					for(const item of list){
						if(item.indexOf("<")>-1){
							var replace = pm5MakePromptAll2(data,item);
							for(const item2 of replace){
								if(item2.prompt.indexOf("<")>-1){
									list.push(item2.prompt);
								}else{
									reallist.push(item2.prompt);
								}
							}
						}else{
							reallist.push(item);
						}
					}
					//don't need to convert to set here, as we make a set below for the full string
					list = reallist;
				}
				
				//get end part
				var ending = pm5MakePrompt(data,match[3]);
				
				var outset = new Set();
				for(const item of list){
					outset.add( match[1] + pm5MakePrompt(data, item) + ending );
				}
				list = Array.from(outset);
				prompt = outset.size + " Prompts:\n" + list.join("\n");
				
			}else{
				//if recursive, get the full list without duplicates
				if(data.ReplaceAllRecursive){
					var reallist = [];
					for(const item of list){
						if(item.indexOf("<")>-1){
							var replace = pm5MakePromptAll2(data,item);
							for(const item2 of replace){
								if(item2.prompt.indexOf("<")>-1){
									list.push(item2.prompt);
								}else{
									reallist.push(item2.prompt);
								}
							}
						}else{
							reallist.push(item);
						}
					}
					//make set to remove duplicates, then convert back to list for join below
					list = Array.from(new Set(reallist));
				}
				
				prompt = match[1] + "{" + list.join(",") + "}" + match[3];
				
			}
		}else{
			//replace this item with random item from list
			var replace = list[Math.floor( Math.random() * list.length )];
			
			//handle pick once option
			if(data.PickOnce == true){
				if(data.data[listname] != null){
					replace = data.data[listname];
				}else{
					data.data[listname] = replace;
				}
			}
			
			prompt = match[1] + replace + match[3];
		}
		
		//get next replace list
		match = pm5GetMatch(prompt);
	}

	return prompt;
}

function pm5GetWordListWords(data, listname){
	
	var list = data.wordlists[listname];
	if(list == null){
		throw new Error(listname);
	}
	list = list.split("\n");
	
	if(data.NoDuplicates == null){
		data.NoDuplicates = false;
	}
	
	//process weight, if any
	var outlist = [...list];
	for(var i=0;i<list.length;i++){
		var item = list[i];
		var match = item.match(pm5weightregex);
		if(match!=null){
			item = match[2];
			outlist[i] = item;
			if(data.EqualProbability == false && data.NoDuplicates == false){
				//only make duplicates if not equal probability
				var count = parseInt( match[1] );
				if(count > 0 && count < 999){
					for(var j=0;j<count-1;j++){
						outlist.push(item);
					}
				}
			}
		}
	}
	
	
	//do equal probability
	if(data.EqualProbability){
		var set = new Set(outlist);
		var outset = new Set();
		outlist.length = 0;
		
		for(var item of set){
			if(item.indexOf("<") > -1){
				//expand replacement, but only one level
				var toadd = [""];
				var toadd2 = [];
				var match = pm5GetMatch(item);
				while(match !=null){
					var sublistname = match[2];
					var sublist = data.wordlists[sublistname].split("\n");
					for(var i = 0; i< toadd.length; i++){
						for(var j = 0; j< sublist.length; j++){
							toadd2.push(toadd[i] + match[1] + sublist[j]);
						}
					}
					toadd = toadd2;
					toadd2 = [];
					item = match[3];
					match = pm5GetMatch(item);
				}
				//add all options to outset
				for(var i = 0; i< toadd.length; i++){
					outset.add(toadd[i] + item); //here item will be the last non angle bracket part of prompt, or the enire promot if the angle brackets were for a lora or something like that
				}
			}else{
				outset.add(item);
			}
		}
		
		//convert outset back to array
		for(const item of outset){
			outlist.push(item);
		}
		
	}
	
	return outlist
}

//do not use
function pm5GenerateAll(){
	var pm5Data = pm5GetData();

	var prompts = [];
	var sel = document.getElementById("pm5prompt");
	if(sel!=null){
		var prompt = sel.options[sel.selectedIndex].value;
		
		try{
			prompts = pm5MakePromptAll(pm5Data,prompt);
		}catch(e){
			alert(e.message);
			return;
		}
		
		var pm5result = document.getElementById("pm5result");
		
		prompts = pm5MakeResultsString(prompts.join("\n"));
		
		pm5result.value = prompts;
		pm5result.scrollTop=0;
		pm5result.scrollLeft = 0;
	}
}

function pm5MakePromptAll(data,prompt){
	var outPrompts = []

	//find first replace list
	var match = pm5GetMatch(prompt);
	if(match !=null){
		var listname = match[2];
		//find list
		var list = pm5GetWordListWords(data,listname);
				
		for(var i = 0;i < list.length;i++){
			//replace this item with item from list
			prompt = match[1] + list[i] + match[3];
			//replace next list
			try{
				outPrompts.push(...pm5MakePromptAll(data,prompt));
			}catch(e){
				throw e;
			}
		}
	}else {
		outPrompts[0] = prompt;
	}

	return outPrompts;
}

//also do not use, but not recursive this time
function pm5GenerateAll2(){
	var pm5Data = pm5GetData();

	var todoprompts = [];
	var doneprompts = [];
	var sel = document.getElementById("pm5prompt");
	if(sel!=null){
		todoprompts.push({"prompt": sel.options[sel.selectedIndex].value, "data":{}});
		
		while(todoprompts.length > 0 ){ //&& doneprompts.length < 100000
			var prompts = [];
			var prompt = todoprompts.pop(); // want to use .shift(); here, to get items in  'correct' order, but shift() is slow compared to pop() with big arrays
			try{
				prompts = pm5MakePromptAll2(pm5Data,prompt.prompt,prompt.data);
			}catch(e){
				alert(e.message);
				return;
			}
			
			for(prompt of prompts){
				if(prompt.prompt.indexOf("<") > -1 ){ //&& todoprompts.length < 10000
					todoprompts.push(prompt);
				}else{
					doneprompts.push(prompt.prompt);
				}
			}
		}
		
		var pm5result = document.getElementById("pm5result");
		
		doneprompts = pm5MakeResultsString(doneprompts.join("\n"));
		
		pm5result.value = doneprompts;
		pm5result.scrollTop=0;
		pm5result.scrollLeft = 0;
	}
}

function pm5MakePromptAll2(data,prompt,choices){
	var outPrompts = []

	//find first replace list
	var match = pm5GetMatch(prompt);
	if(match !=null){
		var listname = match[2];
		
		//handle pick once option
		if(data.PickOnce == true){
			if(choices[listname] != null){
				prompt = match[1] + choices[listname] + match[3];
				outPrompts.push({"prompt":prompt,"data":choices});
				return outPrompts;
			}
		}
				
		//find list
		var list = pm5GetWordListWords(data,listname);

		//using a set to remove duplicates. duplicates are useful for getting some options more than others, but if we are making all, we just want all unique items.
		var set = new Set(list);
		
		//handle pick once option
		if(data.PickOnce == true){
			//pick once code
			for(const item of set){
				//replace this replace item with item from list(set)
				prompt = match[1] + item + match[3];
				choices[listname] = item;
				outPrompts.push({"prompt":prompt,"data":choices});
			}
		}else{
			//normal non pick once code
			for(const item of set){
				//replace this replace item with item from list(set)
				prompt = match[1] + item + match[3];
				outPrompts.push({"prompt":prompt,"data":choices});
			}
		}
	}else {
		outPrompts[0] = prompt;
	}

	return outPrompts;
}

function pm5CountAll(){
	//counts all possible outputs for the currently selected prompt
	var pm5Data = pm5GetData();

	var count = 0;
	var sel = document.getElementById("pm5prompt");
	if(sel!=null){
		var prompt = sel.options[sel.selectedIndex].value;
		
		try{
			count = pm5CountAll2(pm5Data,prompt);
		}catch(e){
			alert(e.message);
			return;
		}
		
		var pm5result = document.getElementById("pm5result");
		pm5result.value = "Prompt Template: " + prompt + "\nTotal unique prompts: " + count;
		pm5result.scrollTop=0;
		pm5result.scrollLeft = 0;
	}
}

function pm5CountAll2(data,prompt){
	var counts = 1;

	//find first replace list
	var match = pm5GetMatch(prompt);
	if(match !=null){
		while( match != null){
			prompt = match[3];
			var count = 0;
		
			var listname = match[2];
			//find list
			var list = pm5GetWordListWords(data,listname);

			//using a set to remove duplicates. duplicates are useful for getting some options more than others, but if we are making all, we just want all unique items.
			var set = new Set(list);
			
			for(const item of set){
				//replace next list
				try{
					count += pm5CountAll2(data,item);
				}catch(e){
					throw e;
				}
			}
			
			//next replace list at this level
			counts *= count;
			match = pm5GetMatch(prompt);
		}
	}

	return counts;
}


function pm5WordListExpand(e){
	if(e != null && e.target != null && e.target.classList.contains("pm5expander")){
		var tgt = e.target.parentElement;
		if(tgt.classList.contains("expanded")){
			tgt.classList.remove("expanded");
			tgt.scrollIntoView();
		}else{
			tgt.classList.add("expanded");
			var ele = document.getElementById("pm5wlcontainer");
			ele.scrollTo(0, 0);
		}
	}
}

function pm5Insert(){
	//insert prompt onto main page
	var pm5results = document.getElementById("pm5result");
	var text = document.getElementById("text");
	if(text.value.length > 0 && !text.value.endsWith("\n")){
		text.value += "\n";
	}
	text.value += pm5results.value;
	pm5results.value = "";
}

function pm5Save(){
	//sort back into original order
	pm5DoWLSort("original",true);
	
	var pm5Data = pm5GetData();
	
	delete pm5Data.PickOnce;
	delete pm5Data.Force;
	delete pm5Data.ForceReplace;
	delete pm5Data.ReplaceAll;
	delete pm5Data.ReplaceAllSeparate;
	delete pm5Data.ReplaceAllRecursive;
	delete pm5Data.EqualProbability;
	delete pm5Data.wordlistcount;
	
	//restore user sort
	pm5WLSort()
	
	showResults(JSON.stringify(pm5Data,null,4));
}

function pm5LoadShow(){
	document.getElementById("pm5load").style.display = "inline";
	document.getElementById("resultstitle").innerText = "Enter JSON to load:";
	result.value = "";
	results.classList.add("open");
}

function pm5LoadButton(){
	var json = result.value;
	results.value = "";
	
	results.classList.remove("open");
	
	var obj = { "responseText": json };
	reqListenerpm5.apply(obj);
}

function pm5ShowCounts(){
//adds a title attribute to each word list title (h4 element) that shows the number of items in the list and the total 'unique' options the list can generate
	var pm5Data = pm5GetData();

	var wlcont = document.getElementById("pm5wlcontainer");
	if(wlcont!=null){
		var ele = wlcont.firstElementChild;
		while(ele != null){
			var res = document.evaluate(".//h4",ele,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
			if(res != null){
				var title = res;
				var total = 0;
				
				res = document.evaluate(".//textarea",ele,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
				if(res != null && res.value.trimEnd().length > 0){
				
					var textarea = res;
					var count = res.value.trimEnd().split("\n").length;
					
					var list = res.value.trimEnd();
					//using a set to remove duplicates. duplicates are useful for getting some option more than others, but if we are counting all unique, we just want all unique items.
					var set = new Set(list.split("\n"));
					
					for(const item of set){
						total += pm5CountAll2(pm5Data,item);
					}
					
					var msg = "Items: "+count+" - Total Unique Options: "+total;
					title.title = msg;
				}
			}
			ele = ele.nextElementSibling;
		}
	}
}

function pm5PromptChange(){
	//called when the selected prompt is changes, updated the select lists with all wordlists referenced by the prompt
	var select = document.getElementById("pm5prompt");
	var prompt = select.options[select.selectedIndex].value;
	var wordlists = new Set();
	var pm5Data = pm5GetData();
	var image = document.getElementById("pm5promptimage");
	var promptimage = select.options[select.selectedIndex].getAttribute("image");
	
	if(promptimage!=null && image!=null){
		image.src=promptimage;
	}else{
		if(image!=null){
			image.src="";
		}
	}
	
	try{
		pm5GetWordLists(pm5Data, prompt, wordlists);
	}catch(e){
		alert("No such  word list: "+e.message);
		return;
	}
	
	var pm5Force = document.getElementById("pm5force");
	var pm5ReplaceAll = document.getElementById("pm5replaceall");
	
	if(pm5Force != null){
		var sel = "";
		//remember selected value
		if(pm5Force.selectedIndex > -1){
			sel = pm5Force.options[pm5Force.selectedIndex].value;
		}
		
		//remove options
		pm5Force.innerHTML = "";
		
		//add back options
		var opt = document.createElement("option");
		opt.value = "";
		opt.innerText = "- NONE -";
		pm5Force.append(opt);
		for(const item of wordlists){
			opt = document.createElement("option");
			opt.value = item;
			opt.innerText = item;
			if(item == sel){
				opt.setAttribute("selected","true");
			}
			pm5Force.append(opt);
		}
	}
	
	if(pm5ReplaceAll != null){
		var sel = "";
		//remember selected value
		if(pm5ReplaceAll.selectedIndex > -1){
			sel = pm5ReplaceAll.options[pm5ReplaceAll.selectedIndex].value;
		}
		
		//remove options
		pm5ReplaceAll.innerHTML = "";
		
		//add back options
		var opt = document.createElement("option");
		opt.value = "";
		opt.innerText = "- NONE -";
		pm5ReplaceAll.append(opt);
		for(const item of wordlists){
			opt = document.createElement("option");
			opt.value = item;
			opt.innerText = item;
			if(item == sel){
				opt.setAttribute("selected","true");
			}
			pm5ReplaceAll.append(opt);
		}
	}
	
	//highlight word list this prompt uses
	var oldele = document.getElementsByClassName("wlselected");
	for(var i = oldele.length-1; i >-1;i--){
		oldele[i].classList.remove("wlselected");
	}
	for(const item of wordlists){
		var ele = document.getElementById("pm5wl-"+item);
		if(ele!=null){
			ele.classList.add("wlselected");
		}
	}
	
	//add number of possible prompts this proms makes next to make prompts button
	var poss = document.getElementById("pm5possibilities");
	if(poss!=null){
		var str = "of "+pm5CountAll2(pm5Data,prompt);
		poss.innerText = str;
	}
	
	//put credit, etc. in results
	var prompts = "";
	prompts = pm5MakeResultsString("");
	
	var pm5result = document.getElementById("pm5result");
	pm5result.value = prompts;
	pm5result.scrollTop=0;
	pm5result.scrollLeft = 0;
}

function pm5GetWordLists(data, prompt, wordlists){
	
	var ep = data.EqualProbability;
	data.EqualProbability = true;

	//find first replace list
	var match = pm5GetMatch(prompt);
	if(match !=null){
		while( match != null){
			prompt = match[3];
		
			var listname = match[2];
			
			//add list if new
			wordlists.add(listname);
			
			//find list
			var list = pm5GetWordListWords(data,listname);
			
			//using a set to remove duplicates. duplicates are useful for getting some options more than others, but if we are making all, we just want all unique items.
			var set = new Set(list);
			
			for(const item of set){
				//replace next list
				try{
					pm5GetWordLists(data, item, wordlists);
				}catch(e){
					data.EqualProbability = ep;
					throw e;
				}
			}
			
			//next replace list at this level;
			match = pm5GetMatch(prompt);
		}
	}

	data.EqualProbability = ep;
}

function pm5WLSort(){
	var ele =document.getElementById("pm5wlsort");
	var type = ele.options[ele.selectedIndex].value;
	var asc = true;
	if(type.startsWith("-")){
		asc = false;
		type = type.substring(1);
	}
	pm5DoWLSort(type, asc);
	
}

function pm5DoWLSort(type,asc){
	var wlcont = document.getElementById("pm5wlcontainer");
	if(wlcont!=null){
		//setup sorter
		var sorter = pm5GetWordListSorter(type,asc);
		//make arry of children
		var eles = [...wlcont.children];
		//sort children in array
		eles = eles.sort(sorter);
		
		//remove children from display
		while (wlcont.firstChild) {
			wlcont.removeChild(wlcont.firstChild);
		}
		//add children back in new order
		for(var i=0; i<eles.length;i++){
			wlcont.appendChild(eles[i]);
		}
	}
}

function pm5GetWordListSorter(type,asc){
	pm5CalcWordListOrder(type);
	
	return (function compare( a, b ) {
				var aa = a.getAttribute("order");
				var bb = b.getAttribute("order");
				
				if( isNaN(aa) === false && isNaN(bb) === false ){
					aa = parseInt(aa);
					bb = parseInt(bb);
				}
				
				if ( aa < bb ){
					return asc?-1:1;
				}
				if ( aa > bb ){
					return asc?1:-1;
				}
				//split ties with id (name)
				if ( a.id < b.id ){
					return asc?-1:1;
				}
				if ( a.id > b.id ){
					return asc?1:-1;
				}
				return 0;
			});
}

function pm5CalcWordListOrder(type){
	var pm5Data = pm5GetData();
	var wlcont = document.getElementById("pm5wlcontainer");
	if(wlcont!=null){
		var ele = wlcont.firstElementChild;
		while(ele != null){
			var res = document.evaluate(".//h4",ele,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
			if(res != null){
				var name = res.innerText;
				
				res = document.evaluate(".//textarea",ele,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
				if(res != null && res.value.trimEnd().length > 0){
					var text = res.value.trimEnd();
					
					var order = "0";
					switch(type){
						case "original": order = ele.getAttribute("origorder"); break;
						case "alpha": order = name; break;
						case "items": order = text.split("\n").length; break;
						case "itemsrecursive":
							//using a set to remove duplicates. duplicates are useful for getting some option more than others, but if we are counting all unique, we just want all unique items.
							var total = 0;
							var set = new Set(text.split("\n"));
							for(const item of set){
								total += pm5CountAll2(pm5Data,item);
							}
							order = total;
							break;
						case "textlength": order = text.length; break;
						case "inprompt": order = 1; if(ele.classList.contains("wlselected")) order = 0; break;
						
						
					}
					
					ele.setAttribute("order",order);
				}
			}
		
			ele = ele.nextElementSibling;
		}
	}
}

function pm5GetTributeArray(){
	var array = [];
	
	var pm5Data = pm5GetData();
	
	for(item in pm5Data.wordlists){
		array.push({key: item});
	}
	for(item of pm5Data.prompts){
		if( item.value.indexOf("<lora:")>-1 || item.value.indexOf("<hypernet:")>-1 ){
			var matches = item.value.match(pm5regexFindLH);
			for(var i=0;i<matches.length;i++){
				var temp = matches[i].substring(1,matches[i].length-1)
				var pos1 = temp.indexOf(":");
				var pos2 = temp.indexOf(":",pos1+1);
				if(pos2 > 0){
					temp = temp.substring(0,pos2);
				}
				array.push({key: temp });
			}
		}
	}
	
	return array;
}

function pm5UpdateTribute(){
	
	if(tribute != null){
		tribute.detach(document.getElementById("pm5newprompt"));
		tribute = null;
	}
	
	
	var values =  pm5GetTributeArray();
	
	tributeData = {
		// symbol or string that starts the lookup
		trigger: '<',

		// element to target for @mentions
		iframe: null,

		// class added in the flyout menu for active item
		selectClass: 'highlight',

		// class added to the menu container
		containerClass: 'tribute-container',

		// class added to each list item
		itemClass: '',

		// function called on select that returns the content to insert
		selectTemplate: function (item) {
			return '<' + item.original.key + '>';
		},

		// template for displaying item in menu
		menuItemTemplate: function (item) {
			return item.string;
		},

		// template for when no match is found (optional),
		// If no template is provided, menu is hidden.
		noMatchTemplate: function () {
			return '<span style:"visibility: hidden;"></span>';
		},

		// specify an alternative parent container for the menu
		// container must be a positioned element for the menu to appear correctly ie. `position: relative;`
		// default container is the body
		menuContainer: document.body,

		// column to search against in the object (accepts function or string)
		lookup: 'key',

		// column that contains the content to insert by default
		fillAttr: 'key',

		// REQUIRED: array of objects to match or a function that returns data (see 'Loading remote data' for an example)
		values: values,

		// When your values function is async, an optional loading template to show
		loadingItemTemplate: null,

		// specify whether a space is required before the trigger string
		requireLeadingSpace: false,

		// specify whether a space is allowed in the middle of mentions
		allowSpaces: true,

		// optionally specify a custom suffix for the replace text
		// (defaults to empty space if undefined)
		replaceTextSuffix: null,

		// specify whether the menu should be positioned.  Set to false and use in conjuction with menuContainer to create an inline menu
		// (defaults to true)
		positionMenu: true,

		// when the spacebar is hit, select the current match
		spaceSelectsMatch: false,

		// turn tribute into an autocomplete
		autocompleteMode: false,

		// Customize the elements used to wrap matched strings within the results list
		// defaults to <span></span> if undefined
		searchOpts: {
			pre: '',
			post: '',
			skip: false // true will skip local search, useful if doing server-side search
		},

		// Limits the number of items in the menu
		menuItemLimit: 25,

		// specify the minimum number of characters that must be typed before menu appears
		menuShowMinLength: 0
	};
	tribute = new Tribute(tributeData);
	tribute.attach(document.getElementById("pm5newprompt"));

}

function pm5GetData(){
	var pm5Data = {"prompts":[],"wordlists":{}};
	
	var sel = document.getElementById("pm5prompt");
	if(sel!=null){
		var opt = sel.firstElementChild;
		while(opt != null){
			var data = {};
			data.name = opt.getAttribute("pm5name");
			data.value = opt.value;
			data.neg = opt.getAttribute("neg");
			data.tips = opt.getAttribute("tips");
			data.credit = opt.getAttribute("credit");
			data.image = opt.getAttribute("image");
			pm5Data.prompts.push(data);
		
			opt = opt.nextElementSibling;
		}
	}
	
	var wlcont = document.getElementById("pm5wlcontainer");
	var wlcount = 0;
	if(wlcont!=null){
		var ele = wlcont.firstElementChild;
		while(ele != null){
			var res = document.evaluate(".//h4",ele,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
			if(res != null){
				var name = res.innerText;
				
				res = document.evaluate(".//textarea",ele,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
				if(res != null && res.value.trimEnd().length > 0){
					pm5Data.wordlists[name] = res.value.trimEnd();
					wlcount++;
				}
			}
		
			ele = ele.nextElementSibling;
		}
	}
	
	pm5Data.wordlistcount = wlcount;
	var pm5Force = document.getElementById("pm5force");
	var pm5ForceReplace = document.getElementById("pm5forcereplace");
	var pm5ReplaceAll = document.getElementById("pm5replaceall");
	var pm5ReplaceAllSeparate = document.getElementById("pm5replaceallseparate");
	var pm5ReplaceAllRecursive = document.getElementById("pm5replaceallrecursive");
	var pm5PickOnce = document.getElementById("pm5pickonce");
	var pm5EqualProbability = document.getElementById("pm5equalprobability");
	
	if(pm5Force != null && pm5ForceReplace != null && pm5Force.selectedIndex > 0){
		pm5Data.Force = pm5Force.value;
		pm5Data.ForceReplace = pm5ForceReplace.value;
	}
	
	if(pm5ReplaceAll != null && pm5ReplaceAll.selectedIndex > 0){
		pm5Data.ReplaceAll = pm5ReplaceAll.value;
		pm5Data.ReplaceAllSeparate = pm5ReplaceAllSeparate.checked;
		pm5Data.ReplaceAllRecursive = pm5ReplaceAllRecursive.checked;
	}
	
	if(pm5PickOnce != null){
		pm5Data.PickOnce = pm5PickOnce.checked;
	}
	
	if(pm5EqualProbability != null){
		pm5Data.EqualProbability = pm5EqualProbability.checked;
	}
	
	return pm5Data;
}



var PromptMakerLibraryBackup = `
{
	"prompts": [{
		"name": "test",
		"value": "<person like subject> <person action>"
	},
	{
		"name":"cute animal",
		"value":"small cute fluffy <gender word> <animal>"
	}],
	"wordlists": {
		"person like subject": "5:a man\\n5:a woman\\na <gender word> kitsune\\nan anthropomorphic <animal> <wmgender word>\\na kemonomimi <animal>-<wmgender word>\\na <gender word> ninja\\na <gender word> samurai",
		"person action": "standing in the middle of the street\\nsitting in their living room\\nhaving a picnic in a forest\\nshopping in a convenience store\\nreading a book in a library\\npracticing fighting\\npetting a <animal>",
		"animal": "dog\\ncat\\nrabbit\\nbunny\\ndeer\\nracoon\\nsquirrel\\nfrog\\nfox\\nkitsune\\npanda\\nsloth\\nbadger\\nlion\\ntiger\\nox\\ncow\\nchicken\\ngoose\\nduck\\npig\\nsheep\\nllama\\nparrot\\npenguin\\nseal\\nbadger\\nlynx\\nboar\\nhippo\\nelephant\\nzebra\\nbear\\npanther\\ndragon",
		"gender word": "male\\nfemale\\ngirl\\nboy",
		"wmgender word": "man\\nwoman\\ngirl\\nboy"
	}
}
`;