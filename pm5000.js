// Prompt Maker 5000
// Copyright (c) 2023 by Brian Risinger

const pm5regexlh = /^([^<]*(?:<(?=lora:|hypernet:)[^<]+)*)<(?!lora:|hypernet:|lyco:)([^>]*)>(.*)$/;
// /^((?:[^<]+|<(?=lora:|hypernet:))*)<([^>]*)>(.*)$/;
const pm5regex = /^([^<]*)<([^>]*)>(.*)$/;
// old, not actually correct (only works if lora / hypernet is at the end  /^([^<]*)<(?!lora:|hypernet:)([^>]*)>(.*)$/;

const pm5regexFindLH = /<((?:lora:|hypernet:|lyco:)[^>]+)>/g;

const pm5weightregex = /^'?(\d+):(.*)$/;

const pm5MultipromptSplit = /,|(?<=\D)\.(?=\D)/;

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
	document.getElementById("pm5promptoptionsskipword").addEventListener("click",pm5PromptOptionSkipWord);
	document.getElementById("pm5promptoptionsskipwordlist").addEventListener("click",pm5PromptOptionSkipWordlist);
	document.getElementById("pm5promptoptionsquit").addEventListener("click",pm5PromptOptionQuit);
	document.getElementById("pm5promtoptionselect").addEventListener("change",pm5PromptOptionSelectChange);
	document.getElementById("pm5newprompt").addEventListener("scroll",pm5NewPromptScroll);
	document.getElementById("pm5Multiprompt").addEventListener("click",pm5DoMultiprompt);
	document.getElementById("pm5Multiprompt2").addEventListener("click",pm5DoMultiprompt2);
	document.getElementById("pm5Multiprompt3").addEventListener("click",pm5DoMultipromptSimple);
	document.getElementById("pm5Dynamicprompt").addEventListener("click",pm5ParseDynamicPrompt);
	document.getElementById("pm5promptoptionsdynamic").addEventListener("click",pm5PromptOptionReplaceDynamic);
	document.getElementById("pm5generatedynamic").addEventListener("click",pm5GenerateDynamic);
	document.getElementById("pm5findWordListTitle").addEventListener("click",pm5WordListFindTitle);
	document.getElementById("pm5findWordListWords").addEventListener("click",pm5WordListFindWord);
	document.getElementById("pm5promptfilter").addEventListener("change",pm5PromptFilter);
	document.getElementById("pm5promptfiltertype").addEventListener("change",pm5PromptFilter);
	document.getElementById("pm5promptfilterclear").addEventListener("click",pm5PromptFilterClear);
	document.getElementById("pm5prompt").addEventListener("keydown",pm5PromptType);
	
	document.getElementById("markovload").addEventListener("click",pm5MarkovLoad);
	document.getElementById("markovsave").addEventListener("click",pm5MarkovSave);
	document.getElementById("markovclear").addEventListener("click",pm5MarkovClear);
	document.getElementById("markovmakeprompts").addEventListener("click",pm5MarkovMakeFromPrompts);
	document.getElementById("markovmaketext").addEventListener("click",pm5MarkovMakeFromText);
	document.getElementById("markovgen").addEventListener("click",pm5MarkovGen);
	document.getElementById("markovcontinue").addEventListener("click",pm5MarkovContinue);
	
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
		pm5Data = JSON.parse(PromptMakerLibraryBackup);
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
			if (promptdata.name.length > 0 && children.querySelector("[pm5name='"+promptdata.name.replaceAll("\'","\\\'")+"']") !=null){
				alert("Duplicate prompt name: "+promptdata.name);
			}
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
			if (children.querySelector("[id='pm5wl-"+wlkey.replaceAll("\'","\\\'")+"']") !=null){
				//this will never occur as json.parse() only keeps last of duplicate keys, but keeping it anyway unless we use a different parser in the future
				alert("Duplicate word list name: "+wlkey);
			}
			if (wordlists[wlkey].includes("\b") ||
				wordlists[wlkey].includes("\f") ||
				wordlists[wlkey].includes("\r") ||
				wordlists[wlkey].includes("\t") ||
				wordlists[wlkey].includes("\v") ) {
				alert("Word List '" + wlkey + "' may contain bad escape sequences!");
			}
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
		
		if(name.startsWith("$$") || name.startsWith("@@") || name.startsWith("!") || name.startsWith("=")){
			alert("A word list name cannot start with any of the following: '!', '=', '$$', '@@'");
			return;
		}
		
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
	
	document.getElementById("pm5save").disabled = true;
	document.getElementById("pm5loadshow").disabled = true;
	document.getElementById("pm5addeditprompt").disabled = true;
	document.getElementById("pm5generate").disabled = true;
	
	
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
	
	document.getElementById("pm5save").disabled = false;
	document.getElementById("pm5loadshow").disabled = false;
	document.getElementById("pm5addeditprompt").disabled = false;
	document.getElementById("pm5generate").disabled = false;
	
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
	const pm5Data = pm5GetData();
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
			//check for unique title
			for(item of pm5Data.prompts){
				if(item.name == name){
					alert("a prompt with that name already exists");
					return;
				}
			}
			
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

function setUpHighlight(prompt,start,end){
	//set up for highlighting
	const highlightcontainer = document.getElementById("highlightcontainer");
	const highlights = document.getElementById("highlights");
	const backdrop = document.getElementById("backdrop");
	if(highlightcontainer.style.width == null || highlightcontainer.style.width.length < 3){
		highlightcontainer.style.width = (prompt.clientWidth + 17) +"px"; //not sure why the 17 is needed, but backdrop is visibly narrower if just client width is used (can see different background color on right edge (in dark mode))
		backdrop.style.width = prompt.clientWidth +"px"; 
		backdrop.style.height = prompt.clientHeight + "px";
	}
	highlights.innerHTML = applyHighlights(prompt.value,start,end);
	highlightcontainer.classList.add("highlight");
	const mark = document.getElementById("thismark");
	mark.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}

function removeHighlight(){
	const highlightcontainer = document.getElementById("highlightcontainer");
	highlightcontainer.classList.remove("highlight");
	const highlights = document.getElementById("highlights");
	highlights.innerHTML = "";
}

function applyHighlights(text, start, end){
	if(text==null) return "";
	text = text.substring(0,start) + "\x01" + text.substring(start,end) + "\x02" + text.substring(end);
	text = text.replace(/\n&/g, '\n\n');
	text = text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
	text = text.replace("\x01","<mark id='thismark'>").replace("\x02","</mark>");
	return text;
}

function pm5NewPromptScroll() {
	const prompt = document.getElementById("pm5newprompt");
	const backdrop = document.getElementById("backdrop");
	backdrop.scrollTop = prompt.scrollTop;
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
	promptoptions.skipwords = new Array();
	
	const pm5Data = pm5GetData();
	//override user settings to get list we want no duplicates, immediate list only (we will go a level deep here making regex more efficient)
	pm5Data.EqualProbability = false;
	pm5Data.NoDuplicates = true;
	//disable prompt textarea
	const prompt = document.getElementById("pm5newprompt");
	prompt.readOnly = true;
	
	//set busy
	document.body.classList.add("busy");
	
	//ok, we are going to make a list of all words/phrases that are parts of word lists mapped to the word lists that contain them
	for(const wlkey in pm5Data.wordlists){
		var list = pm5GetWordListWords(pm5Data,wlkey);
		var rex = "";

		for(var word of list){
			
			//remove weight if there
			var m = word.match(pm5weightregex);
			if(m!=null && !word.startsWith("'")){
				word = m[2];
			} else if(m!=null && word.startsWith("'")){
				word = word.substring(1);
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
					var sublist = pm5GetWordListWords({wordlists: pm5Data.wordlists},sublistname);//pm5Data.wordlists[sublistname].split("\n");
					result += escapeRegExp(match[1])+"(?:";
					var added = false;
					for(var j = 0; j< sublist.length; j++){
						//remove weight if there
						m = sublist[j].match(pm5weightregex);
						if(m!=null && !sublist[j].startsWith("'")){
							sublist[j] = m[2];
						} else if(m!=null && sublist[j].startsWith("'")){
							sublist[j] = sublist[j].substring(1);
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
			
			//make sure user hasn't skipped word
			if(promptoptions.skipwords.includes(match[0])){
				promptoptions.curstart = regex.lastIndex;
				continue;
			}
			
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
			const promptoptionwordlist = document.getElementById("pm5promptoptionwordlistname");
			
			//set up select
			//remove current options
			var selected = select.selectedIndex > -1 ? select.options[select.selectedIndex].value : "";
			var i, L = select.options.length - 1;
			for(i = L; i > -1; i--) {
				select.remove(i);
			}
			//add new options
			for(i=0;i<wordlists.length;i++){
				var option = document.createElement("option");
				option.innerText = option.value = wordlists[i];
				if(option.value == selected){
					option.selected = true; //re-select last selection if possible
				}
				select.appendChild(option);
			}
			select.disabled = wordlists.length < 2;
			
			//set up text area (pre-fill)
			textarea.disabled = true;
			pm5PromptOptionSelectChange();
			
			//show word to replace
			promptoptionword.innerText = match[0];
			promptoptionwordlist.innerText = wordlist;
			
			//show dialog
			document.getElementById("pm5showpromptoptionsaddoptions").classList.remove("hidden");
			document.getElementById("pm5showpromptoptionsdynamic").classList.add("hidden");
			document.getElementById("pm5promptoptionwordlistnameshow").classList.remove("hidden");
			document.getElementById("pm5showpromptoptions").classList.add("open");
						
			//highlight words in prompt
			setUpHighlight(prompttextarea, start, start + length);
			
			//set not busy
			document.body.classList.remove("busy");
			
			//return, so we break out of this loop and let the user interact with the dialog (pressing a button will call this method again)
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
	removeHighlight();
	promptoptions.curstart++;
	pm5FindNextPromptOption();
}

function pm5PromptOptionSkipWord(){
	//close option dialog, remove highlights, continue search from end of last match
	document.getElementById("pm5showpromptoptions").classList.remove("open");
	removeHighlight();
	promptoptions.skipwords.push(promptoptions.curmatch);
	promptoptions.curstart++;
	pm5FindNextPromptOption();
}

function pm5PromptOptionSkipWordlist(){
	//close option dialog, remove highlights, continue search from next word list
	document.getElementById("pm5showpromptoptions").classList.remove("open");
	removeHighlight();
	
	promptoptions.current++;
	promptoptions.curstart = 0;
	
	pm5FindNextPromptOption();
}

function pm5PromptOptionQuit(){
	document.getElementById("pm5showpromptoptions").classList.remove("open");
	//remove highlights
	removeHighlight();
	//re-enable button
	document.getElementById("pm5addoptions").disabled = false;
	promptoptions = null;
	//reset prompt text Area
	const promptele = document.getElementById("pm5newprompt");
	promptele.readOnly = false;
	//set not busy
	document.body.classList.remove("busy");
}

function pm5DoMultiprompt(){
	//takes multiple prompts entered into new prompt text field, and combines them into one prompt
	//requires a name to be entered
	//will make word lists for variations of the prompt (using prompt name as base)
	const pm5Data = pm5GetData();
	
	const wlcont = document.getElementById("pm5wlcontainer");
	const title = document.getElementById("pm5newprompttitle").value;
	if(title == null || title.length < 2){
		alert("Please enter a title before using Multiprompt");
		return;
	}
	const wordlistbase = title+" ";
	var ok = true;
	for(var i=1;i<25;i++){
		if(pm5Data.wordlists[wordlistbase+i] != null){
			ok = false;
		}
	}
	if(!ok){
		alert("The title '"+title+"' is already being used as a wordlist name. Please choose another.");
		return;
	}
	
	var prompt = document.getElementById("pm5newprompt").value.trim();

	prompt = prompt.split("\r\n");
	if(prompt.length == 1){
		prompt = prompt[0].split("\n");
	}
	if(prompt.length < 2){
		alert("Please enter multiple prompts separated by new lines (enter).");
		return;
	}
	if(prompt.length < 5){
		alert("This feature works best with 5 or more prompts, however, we'll try with these.");
	}
	
	//ok we have a good name for wordlists, and we have an array of the prompts
	//make arrays for each position of first prompt, and the match up other prompts
	
	//make basic setup with first prompt
	var curparts = prompt[0].split(pm5MultipromptSplit);
	var pieces = new Array();
	var outparts = new Array();
	outparts[0] = new Array();
	if(curparts.length < 3){
		alert("The prompt '"+prompt[0]+"' is too short. It need to have at least three sections (two commas or periods).");
		return;
	}
	for(var i=0;i<curparts.length;i++){
		pieces[i] = new Array();
		pieces[i].push(curparts[i].trim());
		outparts[0].push(i);
	}
	
	//now add in other prompts, searching for matching phrases
	for(var i = 1; i < prompt.length; i++){
		curparts = prompt[i].split(pm5MultipromptSplit);
		if(curparts.length < 3){
			alert("The prompt '"+prompt[i]+"' is too short. It need to have at least three sections (two commas or periods).");
			return;
		}
		var outpart = new Array();
		
		//now find matches for this prompt - iterate through each part
		for(var j=0;j < curparts.length; j++){
			var phrase = curparts[j].trim();
			var found = -1;
			//try to find phrase in existing lists
			for(var k=0; k<pieces.length;k++){
				if(pieces[k].includes(phrase)){
					found = k;
					break;
				}
			}
			if(found > -1){
				//found phrase - set up outpart
				outpart.push(found);
			}else{
				//no matching phrase, wait for now
				outpart.push(-1);
				/*
				found = pieces.length;
				pieces.push(new Array());
				pieces[found].push(phrase);
				outpart.push(found);
				*/
			}
		}
		
		//ok, above found all matching parts
		//now try to fit in non matching parts
		//TODO - add a loop to these sections so that not only the first outparts is checked against, and only add a new piece if none of the current outparts match
		//first part
		if(outpart[0] == -1){
			var phrase = curparts[0].trim();
			var found = false;
			for(var k=0;k<outparts.length&&!found;k++){
				if(outpart[1] == outparts[k][1] && !outpart.includes(outparts[k][0])){
					//part 0 seems to be alternate first part, add it to the first part options
					pieces[outparts[k][0]].push(phrase);
					outpart[0] = outparts[k][0];
					found = true;
				}
			}
			if(!found){
				//this part seems to be a new part, make a new list
				var pos = pieces.length;
				pieces.push(new Array());
				pieces[pos].push(phrase);
				outpart[0] = pos;
			}
		}
		//last part
		var last = outpart.length-1
		if(outpart[last] == -1){
			var phrase = curparts[last].trim();
			var found = false;
			for(var k=0;k<outparts.length&&!found;k++){
				var klast = outparts[k].length-1;
				if(outpart[last-1] == outparts[k][klast-1] && !outpart.includes(outparts[k][klast])){
					//part last seems to be alternate last part, add it to the last part options
					pieces[outparts[k][klast]].push(phrase);
					outpart[last] = outparts[k][klast];
					found = true;
				}
			}
			if(!found){
				//this part seems to be a new part, make a new list
				var pos = pieces.length;
				pieces.push(new Array());
				pieces[pos].push(phrase);
				outpart[last] = pos;
			}
		}
		//middle parts
		for(var j = 1; j < last; j++){
			if(outpart[j] == -1){
				var phrase = curparts[j].trim();
				var found = false;
				for(var k=0;k<outparts.length&&!found;k++){
					var p1 = outparts[k].indexOf(outpart[j-1]);
					var p2 = outparts[k].indexOf(outpart[j+1]);
					if(p1>-1 && p2>-1 && p1+2 == p2 && !outpart.includes(outparts[k][p1+1])){
						//part j seems to fit between parts j-1 and j+1 (of outparts[k], add it to the outparts[k][p1+1] part options
						pieces[outparts[k][p1+1]].push(phrase);
						outpart[j] = outparts[k][p1+1];
						found = true;
					}
				}
				if(!found){
					//this part seems to be a new part, make a new list
					var pos = pieces.length;
					pieces.push(new Array());
					pieces[pos].push(phrase);
					outpart[j] = pos;
				}
			}
		}
		
		
		//now find out if this phrase set already exist, and if it doesn't, add it to outparts
		/* apparently includes doesn't work for objects or arrays
		if(!outparts.includes(outpart)){
			outparts.push(outpart);
		}
		*/
		found = false;
		for(var j=0;j<outparts.length && found == false;j++){
			if(outparts[j].length == outpart.length){
				var ok = true;
				for(var k=0;k<outpart.length;k++){
					if(outpart[k] != outparts[j][k]){
						ok = false;
						break; //different
					}
				}
				found = ok;
			}
		}
		if(!found){
			outparts.push(outpart);
		}
	}
	
	//all done, have determine all variations
	//now make word lists, and a generator word list
	for(var i=0; i < pieces.length; i++){
		if(pieces[i].length > 1){
			//need to make word list from this list
			wlcont.appendChild(pm5AddWordList(wordlistbase+(i+1),pieces[i].join("\n")));
		}
	}
	
	//make variations of outparts if possible
	outparts = pm5MakeOutpartsVariations(outparts);
	
	//TODO - Better idea - 
	/*
	modify above method to just return the mappings
	then generate new word lists 'linkers' that for each part calls that part, 
	then calls a word list that links to the next possible parts, one of which will be picked
	this will greatly reduce duplication.  
	also, try to join parts that always follower each other instead of having a useless linker between them
	
	could loops be a problem?
	
	*/
	
	
	//now make the generator word list (if needed (will usually be needed unless only one outparts)
	var outstring = "";
	for(var i=0;i < outparts.length ; i++){
		outstring += "\n";
		var outpart = outparts[i];
		for(var j=0;j < outpart.length;j++){
			var part = pieces[outpart[j]];
			if(j>0){
				outstring += ", ";
			}
			if(part.length == 1){
				outstring += part[0];
			}else{
				outstring += "<" + wordlistbase + (outpart[j] + 1) + ">";
			}
		}
	}
	outstring = outstring.trim();
	if(outparts.length > 1){
		wlcont.appendChild(pm5AddWordList(wordlistbase+"generator",outstring));
		outstring = "<"+wordlistbase+"generator>";
	}
	document.getElementById("pm5newprompt").value = outstring;
}

function pm5MakeOutpartsVariations(outparts){
	/* What this does: Suppose we have outparts that looks like:
		[	[1,2,3,4]
			[1,2,5,4]
			[1,2,4,6]	]
	These orderings should imply a few other orderings such as
			[1,2,3,4,6]
			[1,2,5,4,6]
			[1,2,4]
	So this function should take the first array of arrays, and add in the implied arrays,
	so that we will have maximum variation
	*/
	
	var outstrings = new Set();
	var mappings = new Array();//maps one phrase id to the phrase ids that can follow it (-1=start or end);
	
	//make mappings
	for(var i=0;i<outparts.length;i++){
		var previous = -1;
		var outpart = outparts[i];
		for(var j=0;j<=outpart.length;j++){
			var cur = (j < outpart.length)? outpart[j] : -1;
			var mapping = mappings[previous];
			if(mapping == null){
				mapping = new Set();
				mappings[previous] = mapping;
			}
			mapping.add(cur);
			previous = cur;
		}
	}
	
	//now make all paths through the mappings
	function makeMappingPaths(curstring,next){
		var mapping = [...mappings[next]];
		for(var k=0;k<mapping.length;k++){
			var newnext = mapping[k];
			if(newnext < 0){
				outstrings.add(curstring);
			} else{
				//prevent recursion
				if(curstring.split(",").indexOf(""+newnext) < 0){
					var nextstring = ((curstring.length > 0) ? curstring + "," : "") + newnext;
					makeMappingPaths(nextstring,newnext);
				}
			}
		}
	}
	makeMappingPaths("",-1);
	
	//ok now outstrings has all possible path string, convert back into correct format (array of array of int)
	var output = new Array();
	for (const item of outstrings.values()) {
		var arr = item.split(",");
		for(var k=0;k<arr.length;k++){
			arr[k] = parseInt(arr[k]);
		}
		output.push(arr);
	}
	return output;
}

function pm5DoMultiprompt2(){
	//takes multiple prompts entered into new prompt text field, and combines them into one prompt
	//requires a name to be entered
	//will make word lists for variations of the prompt (using prompt name as base)
	//
	//This makes the generator differently that DoMultiprompts()
	//Instead of a single generator wordlist that contains all the prompt templates
	//this creats a generator that includes the first section of the prompt and then 
	//calls one of the word lists for the second section, with each section linking to the sections that can follow it
	//this should result in much smaller data to represent the same possibility space.
	//
	//so first half of this code is the same, but then we figure out possibility of linking one section to the next
	//and build the word lists differently.
	const pm5Data = pm5GetData();
	
	const wlcont = document.getElementById("pm5wlcontainer");
	const title = document.getElementById("pm5newprompttitle").value;
	if(title == null || title.length < 2){
		alert("Please enter a title before using Multiprompt");
		return;
	}
	const wordlistbase = title+" ";
	var ok = true;
	for(var i=1;i<25;i++){
		if(pm5Data.wordlists[wordlistbase+i] != null){
			ok = false;
		}
	}
	if(!ok){
		alert("The title '"+title+"' is already being used as a wordlist name. Please choose another.");
		return;
	}
	
	var prompt = document.getElementById("pm5newprompt").value.trim();

	prompt = prompt.split("\r\n");
	if(prompt.length == 1){
		prompt = prompt[0].split("\n");
	}
	if(prompt.length < 2){
		alert("Please enter multiple prompts separated by new lines (enter).");
		return;
	}
	if(prompt.length < 5){
		alert("This feature works best with 5 or more prompts, however, we'll try with these.");
	}
	
	//ok we have a good name for wordlists, and we have an array of the prompts
	//make arrays for each position of first prompt, and the match up other prompts
	
	//make basic setup with first prompt
	var curparts = prompt[0].split(pm5MultipromptSplit);
	var pieces = new Array();
	var outparts = new Array();
	outparts[0] = new Array();
	if(curparts.length < 3){
		alert("The prompt '"+prompt[0]+"' is too short. It need to have at least three sections (two commas or periods).");
		return;
	}
	for(var i=0;i<curparts.length;i++){
		pieces[i] = new Array();
		pieces[i].push(curparts[i].trim());
		outparts[0].push(i);
	}
	
	//now add in other prompts, searching for matching phrases
	for(var i = 1; i < prompt.length; i++){
		curparts = prompt[i].split(pm5MultipromptSplit);
		if(curparts.length < 3){
			alert("The prompt '"+prompt[i]+"' is too short. It need to have at least three sections (two commas or periods).");
			return;
		}
		var outpart = new Array();
		
		//now find matches for this prompt - iterate through each part
		for(var j=0;j < curparts.length; j++){
			var phrase = curparts[j].trim();
			var found = -1;
			//try to find phrase in existing lists
			for(var k=0; k<pieces.length;k++){
				if(pieces[k].includes(phrase)){
					found = k;
					break;
				}
			}
			if(found > -1){
				//found phrase - set up outpart
				outpart.push(found);
			}else{
				//no matching phrase, wait for now
				outpart.push(-1);
				/*
				found = pieces.length;
				pieces.push(new Array());
				pieces[found].push(phrase);
				outpart.push(found);
				*/
			}
		}
		
		//ok, above found all matching parts
		//now try to fit in non matching parts
		//TODO - add a loop to these sections so that not only the first outparts is checked against, and only add a new piece if none of the current outparts match
		//first part
		if(outpart[0] == -1){
			var phrase = curparts[0].trim();
			var found = false;
			for(var k=0;k<outparts.length&&!found;k++){
				if(outpart[1] == outparts[k][1] && !outpart.includes(outparts[k][0])){
					//part 0 seems to be alternate first part, add it to the first part options
					pieces[outparts[k][0]].push(phrase);
					outpart[0] = outparts[k][0];
					found = true;
				}
			}
			if(!found){
				//this part seems to be a new part, make a new list
				var pos = pieces.length;
				pieces.push(new Array());
				pieces[pos].push(phrase);
				outpart[0] = pos;
			}
		}
		//last part
		var last = outpart.length-1
		if(outpart[last] == -1){
			var phrase = curparts[last].trim();
			var found = false;
			for(var k=0;k<outparts.length&&!found;k++){
				var klast = outparts[k].length-1;
				if(outpart[last-1] == outparts[k][klast-1] && !outpart.includes(outparts[k][klast])){
					//part last seems to be alternate last part, add it to the last part options
					pieces[outparts[k][klast]].push(phrase);
					outpart[last] = outparts[k][klast];
					found = true;
				}
			}
			if(!found){
				//this part seems to be a new part, make a new list
				var pos = pieces.length;
				pieces.push(new Array());
				pieces[pos].push(phrase);
				outpart[last] = pos;
			}
		}
		//middle parts
		for(var j = 1; j < last; j++){
			if(outpart[j] == -1){
				var phrase = curparts[j].trim();
				var found = false;
				for(var k=0;k<outparts.length&&!found;k++){
					var p1 = outparts[k].indexOf(outpart[j-1]);
					var p2 = outparts[k].indexOf(outpart[j+1]);
					if(p1>-1 && p2>-1 && p1+2 == p2 && !outpart.includes(outparts[k][p1+1])){
						//part j seems to fit between parts j-1 and j+1 (of outparts[k], add it to the outparts[k][p1+1] part options
						pieces[outparts[k][p1+1]].push(phrase);
						outpart[j] = outparts[k][p1+1];
						found = true;
					}
				}
				if(!found){
					//this part seems to be a new part, make a new list
					var pos = pieces.length;
					pieces.push(new Array());
					pieces[pos].push(phrase);
					outpart[j] = pos;
				}
			}
		}
		
		
		//now find out if this phrase set already exist, and if it doesn't, add it to outparts
		found = false;
		for(var j=0;j<outparts.length && found == false;j++){
			if(outparts[j].length == outpart.length){
				var ok = true;
				for(var k=0;k<outpart.length;k++){
					if(outpart[k] != outparts[j][k]){
						ok = false;
						break; //different
					}
				}
				found = ok;
			}
		}
		if(!found){
			outparts.push(outpart);
		}
	}
	
	//all done, have determine all variations
	//now make word lists, and a generator word list
	for(var i=0; i < pieces.length; i++){
		if(pieces[i].length > 1){
			//need to make word list from this list
			wlcont.appendChild(pm5AddWordList(wordlistbase+(i+1),pieces[i].join("\n")));
		}
	}
	
		//difference from DoMultiprompt starts here
	
	//make variations of outparts if possible
	var mappings = pm5MakeOutpartsVariations2(outparts);
	
	//Better idea - 
	/*
	modify above method to just return the mappings
	then generate new word lists 'linkers' that for each part calls that part, 
	then calls a word list that links to the next possible parts, one of which will be picked
	this will greatly reduce duplication.  
	also, try to join parts that always follower each other instead of having a useless linker between them
	
	could loops be a problem?
	
	*/
	
	//now make generator word listStyleType
	//for(var i=0;i < mappings.keys().length ; i++){
	//	var key = mappings.keys()[i];
	for(var key of Object.getOwnPropertyNames( mappings )){ //mappings.keys() doesn't like my "-1" array parameter
		//console.log("doing key "+key);
		if(key != parseInt(key)){
			continue;
		}
		key = parseInt(key);
		var name = wordlistbase +"gen";
		name += (key == -1) ? "erator" : ""+key;
		var wl = "";
		
		//check if this mapping only comes from ones that only have one possibility, and skip if so (as it will be automatically included in those
		if(multipromptOnlyIncluded(mappings,key)){
			continue;
		}
		
		var includeNext = true;
		//generate string for this word list
		while( includeNext ){
			includeNext = false;
			
			var set = mappings[key];
			if(key>-1){
				//add either the one phrase or the word list of phrases
				wl += pieces[key].length > 1 ? "<"+wordlistbase+(key+1)+">" : pieces[key][0];
				wl += ", ";
			}
			
			if(set.size==1){
				//this piece is always followed by the next, so combine
				//unless the next piece is always the end
				if(!set.has(-1)){
					includeNext = true;
					key = set.values().next().value;
				}
			}else{
				//make links to next pieces into a word list - if needed (may have already created it)
				var linkwl = "";
				var linkname = wordlistbase+"link"+(key+1);
				if(document.getElementById("pm5wl-"+linkname) == null){
					for (const item of set) {
						if(item == -1){ //handle end of prompt template
							linkwl = "\n" + linkwl;
						}else{
							linkwl += ((linkwl.length > 1) ? "\n":"");
							linkwl += "<"+wordlistbase +"gen"+ item + ">";
						}
					}
					// now add this word list
					wlcont.appendChild(pm5AddWordList(linkname,linkwl));
				}
				
				wl+="<" + linkname +">";
			}
			
		}
		//ok, now add this word list
		wlcont.appendChild(pm5AddWordList(name,wl));
	}

	outstring = "<"+wordlistbase+"generator>";
	
	document.getElementById("pm5newprompt").value = outstring;
}


function multipromptOnlyIncluded(mappings,findkey){
//check if findkey only comes from mappings that only have one possibility (unless it is -1, then we always need it)
	if(findkey == -1){
		return false;
	}
	
	for(var key of Object.getOwnPropertyNames( mappings )){ //mappings.keys() doesn't like my "-1" array parameter
		//console.log("doing key "+key);
		if(key != parseInt(key)){
			continue;
		}
		key = parseInt(key);
		if(mappings[key].has(findkey) && mappings[key].size > 1){
			return false;
		}
	}
	
	return true;
}

function pm5MakeOutpartsVariations2(outparts){
	/* What this does: Suppose we have outparts that looks like:
		[	[1,2,3,4]
			[1,2,5,4]
			[1,2,4,6]	]
	These orderings should imply a few other orderings such as
			[1,2,3,4,6]
			[1,2,5,4,6]
			[1,2,4]
	So this function should take the first array of arrays, and add in the implied arrays,
	so that we will have maximum variation
	
	This version returns the mappings array.
	*/
	
	var outstrings = new Set();
	var mappings = new Array();//maps one phrase id to the phrase ids that can follow it (-1=start or end);
	
	//make mappings
	for(var i=0;i<outparts.length;i++){
		var previous = -1;
		var outpart = outparts[i];
		for(var j=0;j<=outpart.length;j++){
			var cur = (j < outpart.length)? outpart[j] : -1;
			var mapping = mappings[previous];
			if(mapping == null){
				mapping = new Set();
				mappings[previous] = mapping;
			}
			mapping.add(cur);
			previous = cur;
		}
	}
	
	return mappings;
}


function pm5DoMultipromptSimple(){
	//this does a simple multiprompt.
	//break the prompts up into sections by comman and period
	//make prompts by picking one of the possible first sections, then one of the possible second sections, etc.
	
	const pm5Data = pm5GetData();
	
	const wlcont = document.getElementById("pm5wlcontainer");
	const title = document.getElementById("pm5newprompttitle").value;
	if(title == null || title.length < 2){
		alert("Please enter a title before using Multiprompt");
		return;
	}
	const wordlistbase = title+" ";
	var ok = true;
	for(var i=1;i<25;i++){
		if(pm5Data.wordlists[wordlistbase+i] != null){
			ok = false;
		}
	}
	if(!ok){
		alert("The title '"+title+"' is already being used as a wordlist name. Please choose another.");
		return;
	}
	
	var prompt = document.getElementById("pm5newprompt").value.trim();

	prompt = prompt.split("\r\n");
	if(prompt.length == 1){
		prompt = prompt[0].split("\n");
	}
	if(prompt.length < 2){
		alert("Please enter multiple prompts separated by new lines (enter).");
		return;
	}
	if(prompt.length < 5){
		alert("This feature works best with 5 or more prompts, however, we'll try with these.");
	}
	
	//ok we have a good name for wordlists, and we have an array of the prompts
	//make arrays for each position of prompts
	var promptpos = new Array();
	var maxlen = 0;
	//find maxlen
	for(var i = 0; i < prompt.length; i++){
		curparts = prompt[i].split(pm5MultipromptSplit);
		maxlen = curparts.length > maxlen ? curparts.length : maxlen;
	}
	//expand promptpos to maxlen
	for(var i = 0; i < maxlen; i++){
		promptpos[i] = new Array();
	}
	
	//now add parts from each string to propmtpos
	for(var i = 0; i < prompt.length; i++){
		curparts = prompt[i].split(pm5MultipromptSplit);
	
		for(var j = 0; j < curparts.length; j++){

			promptpos[j].push(curparts[j]);
		}
		for(var j = curparts.length; j < promptpos.length; j++){
			//fill any leftover arrays with blanks
			promptpos[j].push("");
		}
	}
	
	//make wordlists
	var outstring = ""
	for(var i = 0; i < promptpos.length; i++){
		var name = wordlistbase +"part "+i;
		var wl = "";
		outstring += "<"+name+">"
		
		//add each phrase from this part of all prompts
		promptpos[i].sort();
		for(var j = 0; j < promptpos[i].length; j++){
			if(j>0) wl += "\n";
			wl += promptpos[i][j].length > 0 ? promptpos[i][j].trim() + ", " : "";
		}
		
		//ok, now add this word list
		wlcont.appendChild(pm5AddWordList(name,wl));
	}
	
	//make prompt
	document.getElementById("pm5newprompt").value = outstring;
}

function pm5ParseDynamicPrompt(){
	// parses a prompt designed for the Automatic1111 plugin 'Dynamic Prompts' into a form PM5000 understands
	// https://github.com/adieyal/sd-dynamic-prompts
	
	const pm5Data = pm5GetData();
	
	const wlcont = document.getElementById("pm5wlcontainer");
	const title = document.getElementById("pm5newprompttitle").value;
	if(title == null || title.length < 2){
		alert("Please enter a title before using Parse Dynamic");
		return;
	}
	const wordlistbase = title+" ";
	var ok = true;
	for(var i=1;i<25;i++){
		if(pm5Data.wordlists[wordlistbase+i] != null){
			ok = false;
		}
	}
	if(!ok){
		alert("The title '"+title+"' is already being used as a wordlist name. Please choose another.");
		return;
	}
	
	const promptele = document.getElementById("pm5newprompt");
	var prompt = promptele.value.trim();
	
	//step 1 - find and convert file references
	var match = prompt.match(/__(\S*)__/i);
	if(match != null){
		var str = "__"+match[1]+"__";
		
		const textarea = document.getElementById("pm5promptoptionwordlist");
		const select = document.getElementById("pm5promtoptionselect");
		
		//set up select
		//remove current options
		var selected = select.selectedIndex > -1 ? select.options[select.selectedIndex].value : "";
		var i, L = select.options.length - 1;
		for(i = L; i > -1; i--) {
			select.remove(i);
		}
		//add new options
		for(i=0;i<pm5Data.wordlistcount;i++){
			var option = document.createElement("option");
			option.innerText = option.value = Object.keys(pm5Data.wordlists)[i];
			if(option.value == match[1]){
				option.selected = true;
			}
			select.appendChild(option);
		}
		select.disabled = pm5Data.wordlists.length < 2;
		
		//set up text area (pre-fill)
		textarea.disabled = true;
		pm5PromptOptionSelectChange();
		
		//show word to replace
		const promptoptionword = document.getElementById("pm5promptoptionword");
		promptoptionword.innerText = str;
		
		//highlight
		const start = prompt.indexOf(str);
		setUpHighlight(promptele, start, start + str.length);
			
		//show dialog
		document.getElementById("pm5showpromptoptionsaddoptions").classList.add("hidden");
		document.getElementById("pm5promptoptionwordlistnameshow").classList.add("hidden")
		document.getElementById("pm5showpromptoptionsdynamic").classList.remove("hidden");
		document.getElementById("pm5showpromptoptions").classList.add("open");
		return;
	}
	
	pm5ParseDynamicPrompt2();
}

function pm5PromptOptionReplaceDynamic(){
	//replace word in prompt then continue search (continue as if we skipped)
	const select = document.getElementById("pm5promtoptionselect");
	const promptele = document.getElementById("pm5newprompt");
	var prompt = promptele.value;
	const promptoptionword = document.getElementById("pm5promptoptionword");
	var word = promptoptionword.innerText;
	const wordlist = select.options[select.selectedIndex].value;
	prompt = prompt.replaceAll(word,"<"+wordlist+">");
	promptele.value = prompt;
	
	//close dialog and look for next matching word
	document.getElementById("pm5showpromptoptions").classList.remove("open");
	removeHighlight();
	pm5ParseDynamicPrompt()
}


function pm5ParseDynamicPrompt2(){
	// parses a prompt designed for the Automatic1111 plugin 'Dynamic Prompts' into a form PM5000 understands
	// https://github.com/adieyal/sd-dynamic-prompts
	
	const pm5Data = pm5GetData();
	const weightMulti = 10;
	var wlid = 1;
	var usename = null;
	
	const wlcont = document.getElementById("pm5wlcontainer");
	const title = document.getElementById("pm5newprompttitle").value;
	if(title == null || title.length < 2){
		alert("Please enter a title before using Multiprompt");
		return;
	}
	const wordlistbase = title+" ";
	var ok = true;
	for(var i=1;i<25;i++){
		if(pm5Data.wordlists[wordlistbase+i] != null){
			ok = false;
		}
	}
	if(!ok){
		alert("The title '"+title+"' is already being used as a wordlist name. Please choose another.");
		return;
	}
	
	var prompt = document.getElementById("pm5newprompt").value.trim();
	
	//step 2 - convert the inline word lists to pm5000 word lists and update prompt
	function ParseDynamicPrompt3(prompt){
		var outprompt = "";
		var pos=-1;
		while( (pos = prompt.indexOf("{")) > -1){
			
			if(pos>0 && prompt.charAt(pos-1) == '$'){
				//this is either a variable diffinition or variable use
				outprompt += prompt.substring(0,pos-1);
				var end = findCloseBracket(prompt,pos,"{}");
				var options = prompt.substring(pos+1,end);
				prompt = prompt.substring(end+1);
				var eq = options.indexOf("=");
				var bracket = options.indexOf("{");
				
				if(eq!=-1 && (bracket == -1 || eq < bracket)){
					//variable defination, turn into word list
					var name = options.substring(0,eq);
					eq++;
					if(options.charAt(eq) == '!'){
						eq++;
					}
					var body = options.substring(eq);
					if(body.charAt(0) == "{" && findCloseBracket(body,0,"{}") == body.length-1){
						//this variable is just one big option list, so use the variable name instead of making a sublist with a numbered name
						usename = name;
						ParseDynamicPrompt3(body);
						usename = null;
					}else{
						var wlstr = ParseDynamicPrompt3(body);
						wlcont.appendChild(pm5AddWordList(wordlistbase+name,wlstr));
					}
					//don't add anything to outprompt
				}else{
					//add reference to word list generate by variable
					var name = options;
					outprompt += "<"+wordlistbase+name+">";
				}
			}else{
			
				//find start and end of this word option string
				outprompt += prompt.substring(0,pos);
				var end = findCloseBracket(prompt,pos,"{}");
				var options = prompt.substring(pos+1,end);
				prompt = prompt.substring(end+1);
				
				
				function pm5ParseDynamicOptions(options){
					var listwlid = wlid;
					var outprompt = "<" + wordlistbase+listwlid + ">";
					
					//deal with multitple picks
					var pos = options.indexOf("$$");
					var posopen = options.indexOf("{");
					if(pos > 0 && (posopen == -1 || pos < posopen)){
						var countstr = options.substring(0,pos);
						var end = options.indexOf("$$",pos+1);
						var sep = ", ";
						if(end > 0 && (posopen == -1 || end < posopen)){
							sep = options.substring(pos+2,end);
						}else{
							end = pos;
						}
						options = options.substring(end+2);
						
						//deal with range of counts
						countstr = countstr.split("-");
						if(countstr[0].length == 0) countstr[0] = "1";
						var x = parseInt(countstr[0]);
						if(countstr.length > 1){
							if(countstr[1].length==0) countstr[1] = ""+(x+1); //this differs from the way
							var y = parseInt(countstr[1]);
							var min = Math.min(x,y);
							var max = Math.max(x,y);
							var wlstr = "";
							for(var i=min;i<max+1;i++){
								wlstr += "\n";
								for(var j=0;j<i;j++){
									
									wlstr += ((j>0)?sep:"") + "<" + wordlistbase + (wlid+1) + ">";
									
								}
							}
							wlstr = wlstr.trim();
							wlcont.appendChild(pm5AddWordList(wordlistbase+wlid,wlstr));
							wlid++;
							listwlid++;
						}else{
							//only a constant number of picks, don't need a sublist.
							//already have one pick set up, add more if needed
							for(var j=1;j<x;j++){
								
								outprompt += sep + "<" + wordlistbase + wlid + ">";
								
							}
						}
					}
					
					wlid++;
					if(options.indexOf("{") > -1){
						//deal with sub lists
						while( (pos = options.indexOf("{")) > -1){
							//this can be a option list or a variable
							if(pos>0 && options.charAt(pos-1)=="$"){
								//variable
								pos--;
								var end = findCloseBracket(options,pos+1,"{}");
								var innerOptions = options.substring(pos,end+1);
								var res = ParseDynamicPrompt3( innerOptions );
								options = options.substring(0,pos) + res + options.substring(end+1);
							}else{
								//find start and end of this word option string
								var str = options.substring(0,pos);
								var end = findCloseBracket(options,pos,"{}");
								var innerOptions = options.substring(pos+1,end);
								
								str += pm5ParseDynamicOptions(innerOptions);
								str += options.substring(end+1);
								options = str;
							}
						}
					}
						
					//now make actual word list
					options = options.split("|");
					var values = new Array(2); //[0] is weight, [1] is actual string
					values[0] = new Array(options.length); 
					values[1] = new Array(options.length); 
					var needWeights = false;
					for(var i=0;i<options.length;i++){
						var option = options[i];
						pos = option.indexOf("::");
						if(pos > 0){
							values[0][i] = parseFloat(option.substring(0,pos)) * weightMulti;
							option = option.substring(pos+2);
							if(values[0][i] != weightMulti) needWeights = true;
						}else{
							values[0][i] = weightMulti;
						}
						
						values[1][i] = option;
					}
					if(needWeights){
						//reduce the weights
						var gcd = findGCD(values[0]);
						for(i=0;i<values[0].length;i++){
							values[0][i] = values[0][i] / gcd;
						}
					}
					//now make word list string
					var wlstr = "";
					for(var i=0;i<options.length;i++){
						if(values[1][i].length == 0 && i>0){
							//blank entries need to be at the beginning the way we handle strings (as blank entries at the end can't be seen in the lists, so we automatically trim the end, but not the beginning) 
							//(they can go in the middle, but the beginning makes it obvious that there is a blank entry in the word list)
							wlstr = (needWeights)?values[0][i]+":\n":"\n" + wlstr;
						}else{
							wlstr += (i>0)?"\n":"";
							wlstr += (needWeights && values[0][i] > 1)?values[0][i]+":":"";
							wlstr += values[1][i];
						}
					}
					
					//add word list
					var listname = (usename != null) ? wordlistbase+usename : wordlistbase+listwlid ;
					wlcont.appendChild(pm5AddWordList(listname,wlstr));
					
					return outprompt;
					
				}
				
				outprompt += pm5ParseDynamicOptions(options);
			}
		}
		
		outprompt += prompt;
		return outprompt;
	}
	
	var outprompt = ParseDynamicPrompt3(prompt);
	
	const promptele = document.getElementById("pm5newprompt");
	promptele.value = outprompt;
	
}

// Function to return gcd of a and b
    function gcd(a, b) {
        if (a == 0)
            return b;
        return gcd(b % a, a);
    }
      
    // Function to find gcd of array of numbers
    function findGCD(arr) {
        let result = arr[0];
        for (let i = 1; i < arr.length; i++) {
            result = gcd(arr[i], result);
      
            if (result == 1) {
                return 1;
            }
        }
        return result;
    }


function findCloseBracket(text, openPos, openclose) {
    var closePos = openPos;
    var counter = 1;
    while (counter > 0 && closePos < text.length) {
        var c = text.charAt(++closePos);
        if (c == openclose[0]) {
            counter++;
        }
        else if (c == openclose[1]) {
            counter--;
        }
    }
    return closePos;
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
				var newprompt = pm5MakePrompt(pm5Data,prompt).trim();
				if(newprompt.endsWith(",")){
					newprompt = newprompt.substring(0, newprompt.length - 1);
				}
				prompts += newprompt + "\n";
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


function expandList(data, list){
	let list2 = [];
	for(let item of list){
		if(item.includes("<") && item.includes(">")){
			// this contains a replacement, need to replace with all options
			const newdata = {...data, ForceReplaceAll: true, ReplaceAllSeparate: true, ReplaceAllRecursive: true};
			let replaceResult = pm5MakePrompt(newdata, item);
			list2.push(...(replaceResult.split('\n')));
		}else{
			list2.push(item);
		}
	}
	return list2;
}


function pm5MakePrompt(data,prompt){
	
	//find first replace list
	let match = pm5GetMatch(prompt);
	while(match !=null){
		let origlistname = match[2];
		
		let prop = getWordListName(origlistname);
		let replaceinfo = prop.replaceInfo || "";
		let replaceType = prop.multiPick || "";
		let pickonce = prop.pickOnce
		let listname = prop.listName;

		//find list
		let list = null;
		if(data.listcache != null){
			if(data.listcache[origlistname] != null){
				list = data.listcache[origlistname];
			}
		} else {
			data.listcache = {};
		}
		if(list == null){
			list = pm5GetWordListWords(data,listname, prop);
			if(data.PickOnce || pickonce){
				//if picking once, we need the full final list without replacement vars, as if there were vars, then that would lead to different words being picked later
				list = expandList(data, list);
			}
			data.listcache[origlistname] = list;
		}
		
		if(data.Force != null && data.Force == listname && data.ForceReplace != null){
			//replace this list with item specified by user
			prompt = match[1] + data.ForceReplace + match[3];
		}else if(data.ReplaceAll != null && data.ReplaceAll == origlistname || data.ForceReplaceAll == true){
			//replace this item with all items from list
			if(data.ReplaceAllSeparate){
			
				//if recursive, get the full list without duplicates
				if(data.ReplaceAllRecursive){
					let reallist = [];
					for(const item of list){
						if(item.indexOf("<")>-1){
							let replace = pm5MakePromptAll2(data,item);
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
				
				/* this doesn't seem to work right, try different method
				//get end part
				let ending = pm5MakePrompt(data,match[3]);
				
				let outset = new Set();
				for(const item of list){
					outset.add( match[1] + pm5MakePrompt(data, item) + ending );
				}
				list = Array.from(outset);
				prompt = outset.size + " Prompts:\n" + list.join("\n");
				*/
				
				let outset = new Set();
				let uniquelist = new Set(list);
				data.Force = listname;
				for(const item of uniquelist){
					data.ForceReplace = item;
					
					const newprompt = prompt.replaceAll("<"+origlistname+">", item);
					outset.add(pm5MakePrompt(data, newprompt));
				}
				
				list = Array.from(outset);
				if(!data.ForceReplaceAll){
					prompt = outset.size + " Prompts:\n" + list.join("\n");
				}else{
					prompt = list.join("\n");
				}
				
			}else{
				//if recursive, get the full list without duplicates
				if(data.ReplaceAllRecursive){
					data.NoDuplicates = true;
					let reallist = [];
					for(const item of list){
						if(item.indexOf("<")>-1){
							let replace = pm5MakePromptAll2(data,item);
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
			if(replaceinfo != ""){
				//handle choose X from list, no repeats
				let unique = (new Set(list)).size;
				if(replaceType == "@@") {
					unique = list.size;
				}
				let min = 0;
				let max = unique;
				let sep = ", ";
				
				if(replaceinfo.includes("|")){
					replaceinfo = replaceinfo.split("|");
					sep = replaceinfo[1];
					replaceinfo = replaceinfo[0]
				}
				if(replaceinfo.includes("-")){
					replaceinfo = replaceinfo.split("-");
					if(replaceinfo[0].length>0){
						min = parseInt(replaceinfo[0]);
					}
					if(replaceinfo[1].length>0){
						max = parseInt(replaceinfo[1]);
					}
					if(max < min) throw new Error("max > min in "+match[2]);
				} else {
					min = max = parseInt(replaceinfo);
				}
				if(replaceType == "$$" && min > unique) min = unique;
				if(replaceType == "$$" && max > unique) max = unique;
				let count = min + Math.floor( Math.random() * (1 + max - min) );
				
				//we now pick 'count' items from the list, removing the item each time, adding separator first if on item 2+
				let replace = "";
				let uselist = list.slice();//copy of list so we don't modify actual list data
				for(let c=0;c<count;c++){
					if(c>0) replace += sep;
					let item = Math.floor( Math.random() * uselist.length );
					let val = uselist[item];
					replace += val;
					if( replaceType == "$$"){
						uselist = uselist.filter(e => e !== val); //remove all copies of just picked item so we don't pick it again
					}
				}
				
				prompt = match[1] + replace + match[3];
				
			} else {
				//normal pick item from list
				//replace this item with random item from list
				let replace = list[Math.floor( Math.random() * list.length )];
				
				//handle pick once option
				if(data.PickOnce == true || pickonce == true){
					if(data.data[listname] != null){
						replace = data.data[listname];
					}else{
						data.data[listname] = replace;
					}
				}
				
				prompt = match[1] + replace + match[3];
			}
		}
		
		//get next replace list
		match = pm5GetMatch(prompt);
	}

	return prompt;
}

function pm5GetWordListWords(data, listname, properties){
	// handle $$ etc
	let equalProb = false;
	
	properties = properties || getWordListName(listname); 
	listname = properties.listName;
	equalProb = properties.equalProb;
	
	var list = data.wordlists[listname];
	if(list == null){
		throw new Error(listname);
	}
	list = list.split("\n");
	
	if(data.NoDuplicates == null){
		data.NoDuplicates = false; //if true, this returns only unique entries (at least it doesn't make duplicates due to weight)
	}
	if(data.DontProcessWeight == null){
		data.DontProcessWeight = false; //if true, this doesn't remove the weight from entries with weight
	}
	
	//process weight, if any
	var outlist = [...list];
	if(!data.DontProcessWeight){
		for(var i=0;i<list.length;i++){
			var item = list[i];
			var match = item.match(pm5weightregex);
			if(match!=null && !item.startsWith("'")){
				item = match[2];
				outlist[i] = item;
				if(data.EqualProbability == false && equalProb == false && data.NoDuplicates == false){
					//only make duplicates if not equal probability
					var count = parseInt( match[1] );
					if(count > 0 && count < 999){
						for(var j=0;j<count-1;j++){
							outlist.push(item);
						}
					}
				}
			} else if(match!=null && item.startsWith("'")){
				outlist[i] = item.substring(1);
			}
		}
	}
	
	
	//do equal probability
	if(data.EqualProbability || equalProb){
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
					var sublist =  pm5GetWordListWords(data, sublistname);
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

function pm5CountAll2(data,prompt, depth, chooseonce){
	depth = depth || 1;
	chooseonce = chooseonce || [];
	
	var counts = 1;
	if(depth>25) return counts;

	//find first replace list
	var match = pm5GetMatch(prompt);
	if(match !=null){
		while( match != null){
			prompt = match[3];
			var count = 0;
			
			var listname = match[2];
			//find list
			var list = pm5GetWordListWords(data,listname);
			
			//handle choose once
			if (listname.startsWith('!')){
				//don't calculate as a new set of items if this is a chooseonce that we already processed
				if (chooseonce.includes(listname)){
					match = pm5GetMatch(prompt);
					continue;
				}
				chooseonce.push(listname);
			}
			
			//using a set to remove duplicates. duplicates are useful for getting some options more than others, but if we are making all, we just want all unique items.
			var set = new Set(list);
			
			for(const item of set){
				//replace next list
				try{
					count += pm5CountAll2(data,item, depth+1, chooseonce);
				}catch(e){
					throw e;
				}
			}
			
			//handle pick several times
			var replaceinfo = "";
			var replaceType = "";
			if(listname.includes("$$")){ //$$ pick multiple from list, no repeats
				var stuff = listname.split("$$");
				replaceinfo = stuff[0];
				replaceType = "$$";
			}
			if(listname.includes("@@")){ //@@ pick multiple from list, repeats allowed
				var stuff = listname.split("@@");
				replaceinfo = stuff[0];
				replaceType = "@@";
			}
			if(replaceinfo != ""){
				//handle choose X from list, no repeats
				var unique = (new Set(list)).size;
				if(replaceType == "@@") {
					unique = 1000;
				}
				var min = 0;
				var max = unique;
				
				if(replaceinfo.includes("|")){
					replaceinfo = replaceinfo.split("|");
					sep = replaceinfo[1];
					replaceinfo = replaceinfo[0]
				}
				if(replaceinfo.includes("-")){
					replaceinfo = replaceinfo.split("-");
					if(replaceinfo[0].length>0){
						min = parseInt(replaceinfo[0]);
					}
					if(replaceinfo[1].length>0){
						max = parseInt(replaceinfo[1]);
					}
					if(max < min) throw new Error("max > min in "+match[2]);
				} else {
					min = max = parseInt(replaceinfo);
				}
				if(min > unique) min = unique;
				if(max > unique) max = unique;
				
				let totalcount = 0;
				for(let num = min;num < max+1;num++){
					let start = count;
					let thiscount = 1;
					for(let cnt = 0;cnt < num;cnt++){
						thiscount *= start;
						if(replaceType == "$$") start--;
					}
					totalcount += thiscount;
				}
				count = totalcount;
			}
			
			//next replace list at this level
			counts *= count;
			match = pm5GetMatch(prompt);
		}
	}

	return counts;
}


function pm5GenerateDynamic(){
	
	const pm5Data = pm5GetData();
	
	var prompt = "";
	var promptout = "";
	var sel = document.getElementById("pm5prompt");
	if(sel!=null){
		prompt = sel.options[sel.selectedIndex].value;
		pm5Data.data = {};
		if(pm5Data.EqualProbability){
			pm5Data.DontProcessWeight = false;//don't want weight if equal probability
		}else{
			pm5Data.DontProcessWeight = true;//this will leave the weight in for Dynamic Prompt
		}
		
		try{
			
			//generate a string that should make an equivelent prompt for Dynamic Prompts A1111 plugin
			//support Pick Once and Equal Probability and Force Replacement
			//will use Dynamic Prompts variable feature to limit prompt length to reasonable length (and make pick once easy)
			
			//part 1 - set up variables
			var wordlists = new Set();
			pm5GetWordLists(pm5Data, prompt, wordlists);
			var equals = "=";
			if(pm5Data.PickOnce){
				equals += "!";
			}
			
			wordlists = [...wordlists];
			for(var j=wordlists.length-1;j>-1;j--){
				//define variables in reverse order, which should define variables before they are used
				var listname = wordlists[j];
				promptout += pm5GenerateDynamicWordlist(pm5Data, listname, equals);
			}
		
			//now replace pm5000 word list references with variables
			prompt = promptout+prompt;
			prompt = pm5GenerateDynamicReplaceWLReferences(prompt);
					
		
		}catch(e){
			alert("No such  word list: "+e.message);
			return;
		}
		
		promptout = prompt;
			
		var pm5result = document.getElementById("pm5result");
		
		promptout = pm5MakeResultsString(promptout);
		
		pm5result.value = promptout;
		pm5result.scrollTop=0;
		pm5result.scrollLeft = 0;
	}
}

function pm5GenerateDynamicReplaceWLReferences(prompt){
	var match = pm5GetMatch(prompt);
	while(match !=null){
		var listname = match[2];
		listname = listname.replaceAll(" ","_");

		prompt = match[1] + "${" + listname + "}" + match[3];
		
		match = pm5GetMatch(prompt);
	}
	return prompt;
}

function pm5GenerateDynamicWordlist(pm5Data, listname, equals){
	var promptout = "";
	equals = equals || "=";
	
	var listnameU = listname.replaceAll(" ","_");
	promptout += "${" + listnameU + equals + "{";

	if(pm5Data.Force != null && pm5Data.Force == listname && pm5Data.ForceReplace != null){
		promptout += pm5Data.ForceReplace;
	}else{
		//find list
		var list = pm5GetWordListWords(pm5Data,listname);
		var outlist = [];
		var outweights = []; 
		for(var i=0;i<list.length;i++){
			var item = list[i];
			var weight = "";
			var match3 = item.match(pm5weightregex);
			if(match3!=null && !item.startsWith("'")){
				outlist.push( match3[2] );
				if(!pm5Data.EqualProbability){
					outweights.push( match3[1] + "::" );
				}else{
					outweights.push("");
				}
			}else if(match3!=null && item.startsWith("'")){
				outlist.push(item.substring(1));
				outweights.push("");
			}else{
				outlist.push( item );
				outweights.push("");
			}
		}
		
		for(var i=0;i<outlist.length;i++){
			outlist[i] = outweights[i] + outlist[i];
		}

		promptout += outlist.join("|");
	}
	promptout += "}}";
	return promptout;
}


function pm5GenerateDynamicOneWithEverything(){
	const pm5Data = pm5GetData();
	
	var promptout = "";
	var equals = "=";
	if(pm5Data.PickOnce){
		equals += "!";
	}
	
	//add word lists
	for(const wlkey in pm5Data.wordlists){
		promptout += pm5GenerateDynamicWordlist(pm5Data, wlkey, equals) + "\n";
	}
	//add prompts definitions and generate all prompts string
	var allPrompts = "{";
	for(item of pm5Data.prompts){
		if(item.value != null && item.value.length > 0){
			var name = item.name.replaceAll(" ","_");
			promptout += "${"+name+"="+item.value+"}\n";
			allPrompts += (allPrompts.length>2 ? "|" :"") + "${" + name +"}";
		}
	}
	allPrompts += "}";
	
	//replace word list references
	var arr = promptout.split("\n");
	for(var i=0;i<arr.length;i++){
		arr[i] = pm5GenerateDynamicReplaceWLReferences(arr[i]);
	}
	promptout = arr.join("\n");
	
	//add actual prompt list to pick one of
	promptout += allPrompts;
	
	//do output
	var pm5result = document.getElementById("pm5result");
		
	promptout = pm5MakeResultsString(promptout);
	
	pm5result.value = promptout;
	pm5result.scrollTop=0;
	pm5result.scrollLeft = 0;
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

function pm5PromptFilter(){
	let filter = document.getElementById('pm5promptfilter').value.toLowerCase();
	let promptSel = document.getElementById('pm5prompt');
	let filterType = parseInt(document.getElementById('pm5promptfiltertype').value);
	
	for(var ele of promptSel.children){
		if (ele.tagName.toLowerCase() == 'option'){
			if( filter.length == 0 || 
				((filterType&1) && ele.getAttribute('pm5name').toLowerCase().includes(filter)) ||
				((filterType&2) && ele.getAttribute('value').toLowerCase().includes(filter)) ){
				ele.classList.remove('filtered');
			} else {
				ele.classList.add('filtered');
			}
		}
	}
}

function pm5PromptFilterClear(){
	let filter = document.getElementById('pm5promptfilter');
	filter.value = '';
	pm5PromptFilter();
}

function pm5PromptType(e){
	let filter = document.getElementById('pm5promptfilter');
	let keyCode = e.keyCode;
	let chrCode = keyCode - 48 * Math.floor(keyCode / 48);
	let chr = String.fromCharCode((96 <= keyCode) ? chrCode: keyCode);
	if(keyCode > 31){
		if (!e.shiftKey){
			chr = chr.toLowerCase();
		}
		if (chr.length > 0 && chr != '\u0000'){
			filter.value += chr;
		}
	} else if(keyCode == 8){
		filter.value = filter.value.substr(0,filter.value.length-1);
	}
	console.log(e.keyCode);
	pm5PromptFilter();
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
	
	//clear and word list find
	pm5WordListFindClear();
	
	//validate that all included word lists exist
	try{
		var dataClone = Object.assign({}, pm5Data);
		dataClone.EqualProbability = false;
		pm5GetWordLists(dataClone, prompt, wordlists);
	}catch(e){
		alert("No such  word list: "+e.message);
		return;
	}
	
	var pm5Force = document.getElementById("pm5force");
	var pm5ReplaceAll = document.getElementById("pm5replaceall");
	
	if(pm5Force != null){
		//reset force replacement combo box
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
		//reset replace with all options combo box
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
		let wlname = getWordListName(item).listName;
		var ele = document.getElementById("pm5wl-"+wlname);
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
	
	data.NoDuplicates = true;

	//find first replace list
	var match = pm5GetMatch(prompt);
	if(match !=null){
		while( match != null){
			prompt = match[3];
		
			var listname = match[2];
			
			if(!wordlists.has(listname)){
			
				//add list if new
				wordlists.add(listname);
				
				//find list
				var list = pm5GetWordListWords(data,listname);
				
				//using a set to remove duplicates. duplicates are useful for getting some options more than others, but if we are making all, we just want all unique items.
				var set = new Set(list);//actually shouldn't need to do this since we are now setting NoDuplicates, but it shouldn't take too much time.
				
				for(const item of set){
					//replace next list
					try{
						pm5GetWordLists(data, item, wordlists);
					}catch(e){
						data.NoDuplicates = false;
						throw e;
					}
				}
			
			}else{
				//we already added this word list, but move it to end of set(list) so we keep list in dependecy order 
				//(dependent items come before items they depend on (so going back to front defined things in correct order)
				wordlists.delete(listname);
				wordlists.add(listname);
			}
			
			//next replace list at this level;
			match = pm5GetMatch(prompt);
		}
	}else if (prompt.includes("<")){
		throw new Error(prompt);
	}

	data.NoDuplicates = false;
}

function getWordListName(listname){
	let ret = { listName: '', pickOnce: false, equalProb: false, multiPick: null, replaceInfo: null};
	if(listname.includes("$$")){ //$$ pick multiple from list, no repeats
		var stuff = listname.split("$$");
		ret.replaceInfo = stuff[0];
		listname = stuff[1];
		ret.multiPick = "$$";
	}
	if(listname.includes("@@")){ //@@ pick multiple from list, repeats allowed
		var stuff = listname.split("@@");
		ret.replaceInfo = stuff[0];
		listname = stuff[1];
		ret.multiPick = "@@";
	}
	if(listname.startsWith("!")){ //pick this once, reuse if list shows up again with pick once
		listname = listname.substring(1);
		ret.pickOnce = true;
	}
	if(listname.startsWith("=")){ // equal probability - ignore weight, and expand first level of replacements
		listname = listname.substring(1);
		ret.equalProb = true;
	}
	if(listname.startsWith("!")){ //pick this once, reuse if list shows up again with pick once - again so ! and = can be any order
		listname = listname.substring(1);
		ret.pickOnce = true;
	}
	ret.listName = listname;
	return ret;
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

function pm5WordListFindTitle(){
	
	pm5WordListFindClear();
	
	let first = true;
	let pm5Data = pm5GetData();
	let find = document.getElementById('pm5findWordList').value.toLowerCase();
	
	for(const key in pm5Data.wordlists){
		if(key.toLowerCase().includes(find)){
			let ele = document.getElementById("pm5wl-"+key);
			if (ele){
				//should always occur
				ele.classList.add('wlhighlight');
				if(first){
					first = false;
					ele.scrollIntoView();
				}
			}
		}
	}
}

function pm5WordListFindWord(){
	
	pm5WordListFindClear();
	
	let first = true;
	let pm5Data = pm5GetData();
	let find = document.getElementById('pm5findWordList').value.toLowerCase();
	
	for(const key in pm5Data.wordlists){
		if(pm5Data.wordlists[key].toLocaleString().includes(find)){
			let ele = document.getElementById("pm5wl-"+key);
			if (ele){
				//should always occur
				ele.classList.add('wlhighlight');
				if(first){
					first = false;
					ele.scrollIntoView();
				}
			}
		}
	}
}

function pm5WordListFindClear(){
	let ele = document.getElementById('pm5wlcontainer');
	if(ele != null){
		let eles = ele.querySelectorAll('.wlhighlight');
		eles.forEach((item) => {
			item.classList.remove('wlhighlight');
		});
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


function pm5OneWithEverything(clean){
	
	let removeLora = clean || false;
	
	var pm5Data = pm5GetData();
	
	var prompt = "";
	var prompts = "";
	var sel = document.getElementById("pm5prompt");

	if(sel!=null){
		
		for(var p = 0; p < sel.options.length; p++){
		
			prompt = sel.options[p].value;

			try{
				pm5Data.data = {};
				prompts += pm5MakePrompt(pm5Data,prompt) + "\n";
			}catch(e){
				alert("No such  word list: "+e.message);
				return;
			}
		}
		
		if(removeLora){
			prompts = prompts.replaceAll(pm5regexFindLH,"");
		}
		
		var pm5result = document.getElementById("pm5result");
		
		prompts = pm5MakeResultsString(prompts);
		
		pm5result.value = prompts;
		pm5result.scrollTop=0;
		pm5result.scrollLeft = 0;
	}
}

function pm5OpenArtParseOld(){
	
	var ele = document.getElementById("pm5result");
	var full = ele.value;
	var lines = full.split('\n');
	var len = lines.length;
	var set = new Set();
	var out = "";
	for(var i=0;i<len;i++){
		
		if(lines[i].startsWith("Prompt: ")){
			var prompt = lines[i].substring(8);
			if(prompt.length <2) continue;
			
			for(var j=i+1;j<len-1;j++,i++){
				if(lines[j].endsWith("[more]") || lines[j].startsWith("Model:"))
					break;
				if(lines[j+1].length < 2)
					break;
				if(prompt.startsWith(lines[j]))
					break;
				
				if(!prompt.endsWith(" ")){
					if(!prompt.endsWith(",")){
						prompt += ",";
					}
					prompt += " ";
				}
				prompt += lines[j];
			}
			
			if(prompt.length >4){
				set.add(prompt.trim());
			}
		}
	}
	
	for (const item of set) {
		out += item+"\n";
	}
	ele.value = out;
}

function pm5OpenArtParse(){
	
	var ele = document.getElementById("pm5result");
	var full = ele.value;
	var lines = full.split('\n');
	var len = lines.length;
	var set = new Set();
	var out = "";
	var prompt = "";
	for(var i=0;i<len;i++){
		
		if(lines[i].startsWith("Prompt: ")){
			prompt = lines[i].substring(8);
			
			for(var j=i+1;j<len;j++,i++){
				if(lines[j].startsWith("Prompt:") || lines[j].endsWith("[more]") || lines[j].startsWith("Model:"))
					break;
				
				if(!prompt.endsWith(" ")){
					//if(!prompt.endsWith(",")){
					//	prompt += ",";
					//}
					prompt += " ";
				}
				prompt += lines[j].trim();
			}
			
			if(prompt.length >4){
				
				//fix up prompt
				prompt = prompt.replaceAll("<mymodel>","").replaceAll("  "," ").trim();
				//fix prompt for Easy Diffusion - remove { } and |
				prompt = prompt.replaceAll("{","(").replaceAll("}",")").replaceAll("|",",").replaceAll("  "," ").trim();
				
				//add prompt to prompt list
				set.add(prompt.replaceAll("“","\"").replaceAll("”","\"").replaceAll(",,,",",").replaceAll(",,",",").replaceAll("   "," ").replaceAll("  "," ").replaceAll("\r","").replaceAll("\n","").trim());
			}
		}
	}
	
	for (const item of set) {
		out += item+"\n";
	}
	ele.value = out;
}

function pm5OpenArtParseUser(){
	
	var ele = document.getElementById("pm5result");
	var full = ele.value;
	var lines = full.split('\n');
	var len = lines.length;
	var set = new Set();
	var out = "";
	for(var i=0;i<len;i++){
		
		if(lines[i].startsWith("Prompt: ")){
			var prompt = lines[i].substring(8);
			if(prompt.length <2) continue;
			
			for(var j=i+1;j<len-1;j++,i++){
				if(lines[j].endsWith("[more]") || lines[j].startsWith("Model:"))
					break;
				if(prompt.startsWith(lines[j]))
					break;
				
				if(!prompt.endsWith(" ")){
					if(!prompt.endsWith(",")){
						prompt += ",";
					}
					prompt += " ";
				}
				prompt += lines[j];
			}
			
			if(prompt.length >4){
				set.add(prompt.trim());
			}
		}
	}
	
	for (const item of set) {
		out += item+"\n";
	}
	ele.value = out;
}

function parseMidjourneyStyleList(onelist){
	var ele = document.getElementById("pm5result");
	var full = ele.value;
	var lines = full.split('\n');
	var len = lines.length;
	var out = {};
	var line = "";
	
	for(var i=0;i<len;i++){
		
		if(onelist){
			line = lines[i];
			var firstChar = line[0];
			if(firstChar != "\t") continue;
			line = line.trim();
		} else {
			line = lines[i].trim();
			if(line.indexOf('\t') < 1) continue;
		}
		
		//handle unicode escapes
		line = line.replace( /\\u([\d\w]{4})/g , function (match, grp) { 
			return String.fromCharCode(parseInt(grp, 16)); 
		} );
		line = line.replace( /\\U([\d\w]{4})/g , function (match, grp) { 
			return String.fromCharCode(parseInt(grp, 16)); 
		} );
		
		var data = line.split("\t");
		if(onelist){
			data = [data[0],"one list name"];
		}else{
			if(data.length != 2 || data[0].length < 2 || data[1].length < 2){
				console.log("unknown line:" +lines[i]);
				continue;
			}
		}
		
		if(out[data[1]] == null){
			out[data[1]] = ""+data[0];
		}else{
			out[data[1]] = out[data[1]]+"\n"+data[0];
		}
	}
	
	showResults(JSON.stringify(out).replaceAll('","','",\n"').replaceAll('{"','{\n"').replaceAll('"}','"\n}'));
}


//markov prompt generator
markov = new Map(); //this will be a map of string (pair of words) to map of string to integer (possible next word mapped to weight)
function pm5MarkovClear(){
	markov = new Map();
	var size = document.getElementById("markovsize");
	if (size!=null){
		size.innerText = markov.size;
	}
}
function pm5MarkovMakeFromPrompts(num){
	var ele = document.getElementById("markovpromptcount");
	if(ele){
		num = num | ele.value;
	}else{
		num = num | 100;
	}
	pm5MarkovMakeFromPromptsCore(num);
}
function pm5MarkovMakeFromPromptsCore(num){
	//will generate num prompts from each prompt template and make the markov chain from them
	var ele = document.getElementById("pm5result");
	ele.value = "";
	
	var pm5Data = pm5GetData();
	
	var promptCnt = 0
	function MarkovMakeFromPromptsCoreHelper(){
		var prompt = pm5Data.prompts[promptCnt].value;
		
		pm5MarkovMakeFromPromptCore(pm5Data, prompt, num);
		
		if(promptCnt % 10 == 0){
			ele.value = ele.value + promptCnt;
		} else {
			ele.value = ele.value + ".";
		}
		promptCnt++;
		if(promptCnt < pm5Data.prompts.length){
			//using set timeout as many prompts or large num will make this take long, and to give browser chance to update display.
			setTimeout(MarkovMakeFromPromptsCoreHelper,10);
		} else {
			ele.value = ele.value + "\nDone!";
		}
	}
	MarkovMakeFromPromptsCoreHelper();
	
	return markov.size;
}
function pm5MarkovMakeFromPrompt(num){
	var ele = document.getElementById("markovpromptcount");
	if(ele){
		num = num | ele.value;
	}else{
		num = num | 100;
	}
	var sel = document.getElementById("pm5prompt");
	if(sel!=null && num!=null){
		prompt = sel.options[sel.selectedIndex].value;
		if (prompt.length > 4){
			var pm5Data = pm5GetData();
			pm5MarkovMakeFromPromptCore(pm5Data, prompt, num);
		} else {
			alert("Please select a prompt at the top of the page");
		}
	}
}
function pm5MarkovMakeFromPromptCore(pm5Data, prompt, num){
	var prompts = "";
	for(var i=0;i<num;i++){
		try{
			pm5Data.data = {};
			prompts += pm5MakePrompt(pm5Data,prompt) + "\n";
		}catch(e){
			alert("No such  word list: "+e.message);
			return;
		}
	}
	
	pm5MarkovMakeFromString(prompts);
	
}

function pm5MarkovMakeFromText(str){
	var ele = document.getElementById("pm5result");
	pm5MarkovMakeFromString(ele.value);
}


function pm5MarkovMakeFromStory(str){
	//like make from string, but combines lines into one string, stopping at a blank line, or a line that starts with a tab (taking an entire paragraph as a prompt example)
	var ele = document.getElementById("pm5result");
	var str = ele.value;
	var prompt = "";
	var strs = str.split("\n")
	for(line of strs){
		var l = line.trim();
		if(l.length == 0 || line.charAt(0) == '\t'){
			pm5MarkovMakeFromString(prompt);
			prompt = "";
		}
		
		if(prompt.length > 0){
			prompt += " ";
		}
		prompt += l;
	}
	
	if(prompt.length > 0){
		pm5MarkovMakeFromString(prompt);
	}
	
}


function pm5MarkovMakeFromString(str){
	//step 1 break string into separate prompts
	var prompts = str.toLowerCase().replaceAll("|",",").replaceAll("“","\"").replaceAll("”","\"").replaceAll("  "," ").replaceAll(" ,",",").replaceAll(",,,",",").replaceAll(",,",",").replaceAll(/,(?! )/gm,", ").replaceAll("\r","").split("\n");
	for(prompt of prompts){
		prompt = prompt.trim();
		if(prompt.length <1) continue;
		
		if(prompt.startsWith("\"") && prompt.endsWith("\"")){
			prompt = prompt.substring(1,prompt.length-1);
		}
		
		//split prompt into 'words'
		var words = pm5MarkovSplitString(prompt);
		
		if(words.length > 1){
			var w1 = words[0];
			var w2 = words[1];
			//remember prompt start
			pm5MarkovAddMapping("", w1+" "+w2);
			
			//encode pairs of words to next word
			for(var i=2; i<words.length; i++){
				var key = w1+" "+w2;
				var w3 = words[i];
				pm5MarkovAddMapping(key, w3)
				w1=w2;
				w2=w3;
			}
			//add end of chain
			var key = w1+" "+w2;
			pm5MarkovAddMapping(key, "\n");
		}
	}
	var ele = document.getElementById("markovsize");
	if(ele != null){
		ele.innerText = markov.size;
	}
	return markov.size;
}
function pm5MarkovAddMapping(key, word){
	//maps a key (pair of words) to the next word (or increases weight if already exists)
	if(markov.has(key)){
		var wordlist = markov.get(key);
		if(wordlist.has(word)){
			wordlist.set(word,wordlist.get(word)+1);
		}else{
			wordlist.set(word,1);
		}
	} else {
		var wordlist = new Map();
		wordlist.set(word,1);
		markov.set(key,wordlist);
	}
}
function pm5MarkovSplitString(prompt){
	//todo keep phrases in quotes, parens, square or curly or angle brackets together, otherwise split on spaces
	var array = [];
	
	while(prompt.length > 0){
		switch(prompt.charAt(0)){
			case '"': 
				var result = pm5getUntil(prompt.substring(1),'"');
				array.push('"'+result.until);
				prompt = result.remain.trim();
				break;
			case '(': 
			case '[': 
			case '{': 
			case '<': 
				var result = pm5getUntilMatchingbracket(prompt);
				var result2 = pm5getUntil(result.remain," ");
				array.push(result.until+result2.until.trim());
				prompt = result2.remain.trim();
				break;
			default:
				var result = pm5getUntil(prompt," ");
				array.push(result.until.trim());
				prompt = result.remain.trim();
				break;
		}
	}
	
	return array;
}
function pm5getUntil(str, chr){
	//gets string up to and including character chr, if character doesn't exist, entire string is return in until
	//return object {until: <beginning of string until character>, remain: <remainder of string>}
	var pos = str.indexOf(chr);
	if(pos < 0){
		return {until: str, remain: ""};
	}
	return {until: str.substring(0,pos+1), remain: str.substring(pos+1)};
}
function pm5getUntilMatchingbracket(str){
	var closePos = openPos = 0;
	var counter = 1;
	var open = str.charAt(0);
	var close = "";
	switch(open){
		case "(": close = ")"; break;
		case "[": close = "]"; break;
		case "{": close = "}"; break;
		case "<": close = ">"; break;
		default: return {until: str, remain: ""};
	}
    while (counter > 0 && closePos < str.length) {
		closePos++;
        var c = str.charAt(closePos);
        if (c == open) {
            counter++;
        }
        else if (c == close) {
            counter--;
        }
    }
    return {until: str.substring(openPos,closePos+1), remain: str.substring(closePos+1)};;

}
function pm5MarkovGen(){
	var ele = document.getElementById("markovgencount");
	var ele2 = document.getElementById("markovgenmaxwords");
	var ele3 = document.getElementById("markovgenminwords");
	var ele4 = document.getElementById("markovgenweight");
	var ele5 = document.getElementById("markovgenstartany");
	if(ele!=null && ele2!=null && ele3!=null && ele4!=null && ele5!=null){
		var num = ele.value;
		var maxwords = ele2.value;
		var minwords = ele3.value;
		var weight = ele4.checked;
		var startany = ele5.checked;
		pm5MarkovGeneratePrompts(num,maxwords,minwords,weight, startany);
	}
}
function pm5MarkovGeneratePrompts(num,maxlen,minlen,weight, startany){
	var ele = document.getElementById("pm5result");
	
	var prompts = "";
	for(var i=0;i<num;i++){
		prompts += pm5MarkovGeneratePrompt(maxlen,minlen,weight, startany) +"\n";
	}
	ele.value = prompts;
	
}
function pm5MarkovContinue(){
	var ele = document.getElementById("markovgencount");
	var ele2 = document.getElementById("markovgenmaxwords");
	var ele3 = document.getElementById("markovgenminwords");
	var ele4 = document.getElementById("markovgenweight");
	var result = document.getElementById("pm5result");
	if(ele!=null && ele2!=null && ele3!=null && ele4!=null && result!=null){
		var num = ele.value;
		var maxwords = ele2.value;
		var minwords = ele3.value;
		var weight = ele4.checked;
		var prompts = result.value;
		pm5MarkovContinuePrompts(num,maxwords,minwords,weight, prompts);
	}
}
function pm5MarkovContinuePrompts(num,maxlen,minlen,weight, inprompts){
	var ele = document.getElementById("pm5result");
	
	var prompts = "";
	var promptarray = inprompts.split("\n");
	for(var j=0;j<promptarray.length;j++){
		var p = promptarray[j].trim();
		if(p.length > 1){
			for(var i=0;i<num;i++){
				prompts += pm5MarkovGeneratePrompt(maxlen,minlen,weight,false, p) +"\n";
			}
		}
	}
	ele.value = prompts;
	
}
function pm5MarkovGeneratePrompt(maxlen, minlen, weight, startany, str){
	maxlen = maxlen | 150;
	minlen = minlen | 4;
	if(str == null){
		str = "";
	}
	
	while(true){
		var words = pm5MarkovSplitString(str);
		var w1 = "";
		var w2 = "";
		var prompt = "";
		var rand = 0;
		if(words.length > 1){
			//continue prompt from string
			prompt = str;
			w1 = words[words.length-2];
			w2 = words[words.length-1];
		} else {
			//generate new prompt start
			if(startany){
				//start with any pair of words
				var keylen = markov.size;
				rand = Math.floor( Math.random() * keylen );
				prompt = get_nth_key(markov, rand);
			} else {
				//start only with word pair that have started a prompt
				var wordlist = markov.get("");
				if(weight){
					//use weight
					//iterate over entries and calc total weight
					var weight = 0;
					for (let value of wordlist.values()){
						weight += value;
					}
					//pick random less than total weight
					rand = Math.floor( Math.random() * weight );
					//get word at weight
					prompt = "\n";
					weight = 0;
					for (let [word, value] of  wordlist.entries()) {
						weight += value;
						if(weight > rand){
							prompt = word;
							break;
						}
					}
				} else {
					//ignoring weight
					var entries = wordlist.size;
					//pick random less than total entries
					rand = Math.floor( Math.random() * entries );
					//get word at random entry
					prompt = get_nth_key(wordlist,rand);
					if(prompt==undefined) prompt = "\n";
				}
			}
			words = pm5MarkovSplitString(prompt);
			if(words.length != 2){
				return "Picked '"+words+"' to start, but not length 2!";
			}
			w1 = words[0];
			w2 = words[1];
		}
		
		for(var j=2;j<maxlen;j++){
			var key = w1+" "+w2;
			var wordlist = markov.get(key);
			if(wordlist == null){
				return "Could not continue from '"+key+"'!";
			}
			if(weight){
				//iterate over entries and calc total weight
				var weight = 0;
				for (let value of wordlist.values()){
					weight += value;
				}
				//pick random less than total weight
				rand = Math.floor( Math.random() * weight );
				//get word at weight
				var w3 = "\n";
				weight = 0;
				for (let [word, value] of  wordlist.entries()) {
					weight += value;
					if(weight > rand){
						w3 = word;
						break;
					}
				}
			} else {
				//ignoring weight
				var entries = wordlist.size;
				//pick random less than total entries
				rand = Math.floor( Math.random() * entries );
				//get word at random entry
				var w3 = get_nth_key(wordlist,rand);
				if(w3==undefined) w3 = "\n";
			}
			if(w3 == "\n"){
				break;
			}
			prompt += " " + w3;
			w1 = w2;
			w2 = w3;
		}
		
		if(prompt.split(" ").length >= minlen){
			return prompt;
		}
	}
}
function pm5MarkovLookupWord(word){
	var phrases = "";
	for(let phrase of markov.keys()){
		var words = pm5MarkovSplitString(phrase);
		if(words.length == 2){
			if(words[0] == word || words[1] == word){
				phrases += phrase +"\n";
			}
		}
	}
	var ele = document.getElementById("pm5result");
	ele.value = phrases;
}
//function get_nth_key<K, V>(m: Map<K, V>, n: number): K | undefined {
function get_nth_key(m, n){
  if (n < 0) {
    return undefined;
  }
  const it = m.keys();
  for (;;) {
    const res = it.next();
    if (res.done) {
      return undefined;
    }
    if (n <= 0) {
      return res.value;
    }
    --n;
  }
}
function pm5MarkovSave(){
	var ele = document.getElementById("pm5result");
	ele.value = JSON.stringify(markov, mapreplacer).replaceAll("]]}],","]]}],\n");
}
function pm5MarkovLoad(){
	var ele = document.getElementById("pm5result");
	markov = JSON.parse(ele.value,mapreviver);
	var size = document.getElementById("markovsize");
	if (size!=null){
		size.innerText = markov.size;
	}
}
function mapreplacer(key, value) {
  if(value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else {
    return value;
  }
}
function mapreviver(key, value) {
  if(typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
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
	},
	{
		"name":"Pick Range (generate random word)",
		"value":"a table with a <random english wordlike> on it"
	},
	{
		"name":"Pick Range no repeats (generate random word)",
		"value":"a table with a <random english wordlike no repeat letters> on it"
	},
	{
		"name":"Pick Once (generate random word)",
		"value":"A boy with a <!animal> and a girl with a <animal>. The <!animal> is eating."
	}],
	"wordlists": {
		"person like subject": "5:a man\\n5:a woman\\na <gender word> kitsune\\nan anthropomorphic <animal> <wmgender word>\\na kemonomimi <animal>-<wmgender word>\\na <gender word> ninja\\na <gender word> samurai",
		"person action": "standing in the middle of the street\\nsitting in their living room\\nhaving a picnic in a forest\\nshopping in a convenience store\\nreading a book in a library\\npracticing fighting\\npetting a <animal>",
		"animal": "dog\\ncat\\nrabbit\\nbunny\\ndeer\\nracoon\\nsquirrel\\nfrog\\nfox\\nkitsune\\npanda\\nsloth\\nbadger\\nlion\\ntiger\\nox\\ncow\\nchicken\\ngoose\\nduck\\npig\\nsheep\\nllama\\nparrot\\npenguin\\nseal\\nbadger\\nlynx\\nboar\\nhippo\\nelephant\\nzebra\\nbear\\npanther\\ndragon",
		"gender word": "male\\nfemale\\ngirl\\nboy",
		"wmgender word": "man\\nwoman\\ngirl\\nboy",
		"english letter frequency": "82:a\\n15:b\\n28:c\\n43:d\\n127:e\\n22:f\\n20:g\\n61:h\\n70:i\\n2:j\\n8:k\\n40:l\\n24:m\\n67:n\\n75:o\\n19:p\\n1:q\\n60:r\\n63:s\\n91:t\\n28:u\\n10:v\\n24:w\\n1:x\\n20:y\\n1:z",
		"random english wordlike": "<3-8|@@english letter frequency>",
		"random english wordlike no repeat letters": "<3-8|$$english letter frequency>"
	}
}
`;