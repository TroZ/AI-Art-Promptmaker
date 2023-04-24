# AI-Art-Promptmaker
AI Art Promptmaker will help you generate random ai art prompts based off of prompt templates

You can try it out here:
https://troz.github.io/AI-Art-Promptmaker/pm5000.html
or

Download all the files and put them in a directory together.
If this is on a web server, you should be able to open the pm5000.html file in a browser and it will automatically load the data file.
If you are loading the page off your harddrive, the browser probably won't be able to open the data file automatically. In that case,
click the 'Load Settings" button at the bottom of the page, open the 'pm5000library.json' file and copy and paste it's contents into
the textarea on the webpage and then click the 'Load' button at the bottom. This will populate the prompt library and word lists.

To use, pick a prompt from the combo box a the top. This will highlight the used word lists as well as show a example image in the top
right (for some of the prompts) and give some information at the bottom. Select how many prompts you want (default is 5) and then click
the 'Make Prompts' button.

This will add to the bottom the number of prompts you chose, by taking the prompt template and replacing word list references 
(the name of a word list surrounded in angle brackets '<>') with a random word from that word list.  Word list are in the middle of the
page, where you can edit them and add new word lists. Word list consist of words or phrases or other word list references, separated by
new lines. Click the double arrow button in the corner of a word list to expand it's size (or return it to original size).

You can use the 'Add / Edit Prompt' button to add new prompts or edit existing prompts. This opens a dialog. Initially 'New Prompt' is
selected, and you can enter the information for a new prompt. Clicking the 'Add Prompt' button while 'New Prompt' is selected will add
a new prompt to the bottom of the main prompt combo box. If you select an existing prompt, it's data can be edited. Clicking 
'Add Prompt' while a prompt is selected will modify that prompt to the new settings. When finished, click 'Close' to remove the dialog 
and update the main prompt combo box.

While editing a prompt, starting a word list reference (typing '<') will open a small popup dialog showing a list of the word lists that 
match what you are typing. You can continue to type to reduce the number of matches shown, or select one of the matches to complete the 
word list reference. This is done using the tribute.js library ( https://github.com/zurb/tribute ). Additionally, after you have entered
your prompt, you can click the 'add options' button. This will scan your prompt for words or phrases that exist in a word list, and if 
any are found, it will suggest you replace that word or phrase with a reference to the word list. This allows your prompt template 
generate a larger range of prompts. When a potential replacement is found, you are shown a combo box with the names of the potential
word lists that contain this word or phrase, and will be show the list of word and phrases in the selected word list. Selecting a 
different word list in the combo box will show it's list of words (and if only one word list contains the word of phrase, the combo box
will be disabled). You can click the 'replace' button to replace the word or phrase with the suggested word, you can use the 'skip' button
to skip replacing this word and move on to the next word found, or you can press the 'quit' button to stop the search for word or phrases
to replace.

You can use the 'Add Word List' text field and 'Add' button to add a new word list. Just type a name for the new word list and click the 
'Add' button. This will add the word list to the end of the current word lists. There you and type the word or phrases you want to have
in the word list. Remember to to have each word or phrase on it's own line (press enter after each word or phrase). If you have long 
phrases, it may be easier to expand the word list size by clicking on the double arrow in the top right corner of the word list. Click
it again to return the word list to it's original size. You can also use the sort combo box to sort the order of the word lists. Clicking
the 'Show Counts' will cause hovering your mouse over the word list titles to show how many items are directly in each word list and 
the total number of items that are in the word list when all references to other word lists are expanded.

When creating word list with references, please avoid having a word list reference itself or creating a circular references of word list
(list A referencing list B which references list C with references list A). The code is not designed to handle this and will likely 
results in javascript recursion exceptions.

After editing prompts, make sure to click the 'Save Settings' button at the bottom, and copy and paste the text shown into either a new
file, or update the existing 'pm5000library.json' file.



Most of the default prompts are from reddit.com/r/stablediffusion, lexica.art, publicprompts.art, or prompthero.com . 
No copyright over the example prompts is claimed and the license for this program does not extend to the default prompt data.


If you come up with good prompts, please submit them and I'll update the default data.
