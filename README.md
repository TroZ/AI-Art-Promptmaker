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

After editing prompts, make sure to click the 'Save Settings' button at the bottom, and copy and paste the text shown into either a new
file, or update the existing 'pm5000library.json' file.



Most of the default prompts are from reddit.com/r/stablediffusion, lexica.art, publicprompts.art, or prompthero.com .


If you come up with good prompts, please submit them and I'll update the default data.
