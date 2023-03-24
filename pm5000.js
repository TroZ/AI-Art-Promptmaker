// Prompt Maker 5000
// Copyright (c) 2023 by Brian Risinger

const pm5regexlh = /^([^<]*(?:<(?=lora:|hypernet:)[^<]+)*)<(?!lora:|hypernet:)([^>]*)>(.*)$/;
// /^((?:[^<]+|<(?=lora:|hypernet:))*)<([^>]*)>(.*)$/;
const pm5regex = /^([^<]*)<([^>]*)>(.*)$/;
// old, not actually correct (only works if lora / hypernet is at the end  /^([^<]*)<(?!lora:|hypernet:)([^>]*)>(.*)$/;

const pm5weightregex = /^(\d+):(.*)$/;

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
	
	
	
	const req = new XMLHttpRequest();
	req.addEventListener("load", reqListenerpm5);
	req.addEventListener("error", reqFailpm5);
	req.open("GET", "./pm5000library.json");
	req.send();

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
		alert("Error parsing Prompt Maker Library: "+e.message);
		return;
	}
	
	pm5FillPrompts(pm5Data.prompts);
	
	pm5FillWordLists(pm5Data.wordlists);
	
	pm5PromptChange();
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
		alert("Error adding prompt");
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
		
		var neg = sel.options[sel.selectedIndex].getAttribute("neg");
		var tips = sel.options[sel.selectedIndex].getAttribute("tips");
		var credit = sel.options[sel.selectedIndex].getAttribute("credit");
		if( (neg!=null && neg.length>0) || (tips!=null && tips.length>0) || (credit!=null && credit.length>0)){
			prompts = "Prompts:\n"+prompts;
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
		
		pm5result.value = prompts;
		pm5result.scrollTop=0;
		pm5result.scrollLeft = 0;
	}
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
								if(item2.indexOf("<")>-1){
									list.push(item2);
								}else{
									reallist.push(item2);
								}
							}
						}else{
							reallist.push(item2);
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
								if(item2.indexOf("<")>-1){
									list.push(item2);
								}else{
									reallist.push(item2);
								}
							}
						}else{
							reallist.push(item2);
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
	
	//process weight, if any
	var outlist = [...list];
	for(var i=0;i<list.length;i++){
		var item = list[i];
		var match = item.match(pm5weightregex);
		if(match!=null){
			item = match[2];
			outlist[i] = item;
			if(data.EqualProbability == false){
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
		pm5result.value = prompts.join("\n");
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
		pm5result.value = doneprompts.join("\n");
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
	var pm5Data = pm5GetData();
	
	delete pm5Data.PickOnce;
	delete pm5Data.Force;
	delete pm5Data.ForceReplace;
	delete pm5Data.ReplaceAll;
	delete pm5Data.ReplaceAllSeparate;
	delete pm5Data.ReplaceAllRecursive;
	delete pm5Data.EqualProbability;
	
	
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
	var neg = select.options[select.selectedIndex].getAttribute("neg");
	var tips = select.options[select.selectedIndex].getAttribute("tips");
	var credit = select.options[select.selectedIndex].getAttribute("credit");
	if( (neg!=null && neg.length>0) || (tips!=null && tips.length>0) || (credit!=null && credit.length>0)){
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
	
	var pm5result = document.getElementById("pm5result");
	pm5result.value = prompts;
	pm5result.scrollTop=0;
	pm5result.scrollLeft = 0;
}

function pm5GetWordLists(data, prompt, wordlists){

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
					throw e;
				}
			}
			
			//next replace list at this level;
			match = pm5GetMatch(prompt);
		}
	}

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
	if(wlcont!=null){
		var ele = wlcont.firstElementChild;
		while(ele != null){
			var res = document.evaluate(".//h4",ele,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
			if(res != null){
				var name = res.innerText;
				
				res = document.evaluate(".//textarea",ele,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
				if(res != null && res.value.trimEnd().length > 0){
					pm5Data.wordlists[name] = res.value.trimEnd();
				}
			}
		
			ele = ele.nextElementSibling;
		}
	}
	
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
		"animal": "dog\\ncat\\nrabbit\\nbunny\\ndeer\\nracoon\\nsquirl\\nfrog\\nfox\\nkitsune\\npanda\\nsloth\\nbadger\\nlion\\ntiger\\nox\\ncow\\nchicken\\ngoose\\nduck\\npig\\nsheep\\nllama\\nparrot\\npenguin\\nseal\\nbadger\\nlynx\\nboar\\nhippo\\nelephant\\nzebra\\nbear\\npanther\\ndragon",
		"gender word": "male\\nfemale\\ngirl\\nboy",
		"wmgender word": "man\\nwoman\\ngirl\\nboy"
	}
}
`;