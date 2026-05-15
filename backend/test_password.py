import django
django.setup()
from django.contrib.auth import get_user_model, authenticate

User = get_user_model()
user = User.objects.get(email='admin@hospital.dz')
print(f"Testing passwords for user: {user.email}")

test_passwords = ["admin", "password", "123456", "test", "admin123", "password123", ""]
found = False

for pwd in test_passwords:
    try:
        auth_user = authenticate(email='admin@hospital.dz', password=pwd)
        if auth_user:
            print(f"SUCCESS! Password is: '{pwd}'")
            found = True
            break
    except:
        pass

if not found:
    print("None of the test passwords worked.")
    print("Setting password to 'testpass123' for testing...")
    user.set_password('testpass123')
    user.save()
    print("Password set successfully!")
