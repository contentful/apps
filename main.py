'''

                            Online Python Debugger.
                Code, Run and Debug Python program online.
Write your code in this editor and press "Debug" button to debug program.

'''
"""

print("Hello World")
class Account:
def_init_(self):
self.balance=0
print('Your Account is Created.')
def deposit(self):
amount=int(input('Enter the amount to deposit:'))
self.balance+=amount
print('Your New Balance =%d' %self.balance)
def withdraw(self):
amount=int(input('Enter the amount to withdraw:'))
if(amount>self.balance):
print('Insufficient Balance!')
else:
self.balance-=amount
print('Your Remaining Balance =%d' %self.balance)
def enquiry(self):
print('Your Balance =%d' %self.balance)
account= Account()
account.deposit()
account.withdraw()
account.enquiry()
'''
"""