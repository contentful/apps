# Digimon Life Support System v1.4.x
# a spiritual port of the arduino based program of the same name.
# added new timings to support 10x mode.

# We import the module for GPIO on the PocketChip
import CHIP_IO.GPIO as GPIO

# Next we import the module that will govern our time based intervals
import time

# I'm using two different delays for button presses because some animations take longer than others (scrolling, eating animations for example).
# this delay is responsible for animations
animwait = .6

# This variable is just a standard wait time used for button presses. Useful when in 10x mode because short button presses are often missed.
pausetime = 0.15

# This list contains the individual wait intervals for each function, needs experimenting/tweaking.
interval = [0, 10, 1000, 30, 40]

# This list stores the time that the function was last executed.
timelast = [0, 0, 0, 0, 0]

# Set up each GPIO as an output for the A, B and C buttons.
GPIO.setup("XIO-P2", GPIO.OUT)
GPIO.setup("XIO-P3", GPIO.OUT)
GPIO.setup("XIO-P4", GPIO.OUT)

# this function sets all buttons to high (a logic no in this case)
def clearbut():
    GPIO.output("XIO-P2", GPIO.HIGH)  
    GPIO.output("XIO-P2", GPIO.HIGH)  
    GPIO.output("XIO-P2", GPIO.HIGH)  
       
       
# This function presses A
def pressa():
    print "pressing A"
    GPIO.output("XIO-P2", GPIO.LOW)
    time.sleep(pausetime)
    GPIO.output("XIO-P2", GPIO.HIGH)  
    time.sleep(pausetime)

# This function presses B
def pressb():
    print "pressing B"
    GPIO.output("XIO-P3", GPIO.LOW)
    time.sleep(pausetime)
    GPIO.output("XIO-P3", GPIO.HIGH)  
    time.sleep(pausetime)

# This function presses C
def pressc():
    print "pressing C"
    GPIO.output("XIO-P4", GPIO.LOW)
    time.sleep(pausetime)
    GPIO.output("XIO-P4", GPIO.HIGH)         
    time.sleep(pausetime)

# The following functions group the previous functions together and allow us to execute them in sequences that perform specific actions.
# I will detail the first function just to help elucidate my methods.

# I define a function with no arguments.

def feedmeal():
    
    # I send some text to the screen to let the user know a function is being performed.
    print "Feeding a Meal"
    
    # I press "A" twice to highlight the "Meal" icon on screen.
    pressa()
    pressa()
    
    # to make sure the digimon gets enough food I press B 7 times to ensure there are enough. Its not precise.
    for x in range (0,6):
	 pressb()
     # I wait for the animation to finish before pressing the button again.
	 time.sleep(animwait)
    
    # I press "C" twice to ensure the digimon exits the Meal program.
    pressc()
    pressc()

# The rest of the functions are variations on the previous one.

def feedpill():
	print "Feeding a Pill"
    
	pressa()
	pressa()
	pressb()
	pressa()
	pressb()
    
	time.sleep(animwait)
    
	pressc()
	pressc()

def playgame():
	print "Playing a game"
    
	pressa()
	pressa()
	pressa()
	pressb()
    
	for x in range (0,25):
		pressb()
		time.sleep(animwait)
        
	pressc()
	pressc()

def cleanup():
	print "Cleaning Up"
    
	for x in range (0,5):
		pressa()
        
	pressb()
	time.sleep(animwait)
	pressc()
	pressc()

# The program really starts here and these next few lines act as initialization. 
# First we clear the GPIO and bring them all HIGH to ensure there is nothing floating. 
# I don't know if this is necessary just seems like good practice.

clearbut()

# I clear the console screen for neatness-sake.
os.system('clear')	

# I let the user know the program has started.
print "program started"

# I begin a loop to 
while True:
# check time
    timenow = time.time()
    
# The next run of if statements checks the current time against the last time the statement was run has
# If the elapsed time is greater than the pre-set interval the function is run.

    if timenow - timelast[1] > interval[1]:
        feedmeal()
        timelast[1] = timenow
	os.system('clear')	
       
    if timenow - timelast[2] > interval[2]:
        feedpill()
	timelast[2] = timenow
	os.system('clear')	
       
    if timenow - timelast[3] > interval[3]:
        playgame()
	timelast[3] = timenow
	os.system('clear')	
       
    if timenow - timelast[4] > interval[4]:
	cleanup()
	timelast[4] = timenow
	os.system('clear')

    # before the loop cycles we clear out the buttons.
    
    clearbut()




