import requests
import json
from datetime import datetime

# URL of the backend API
BASE_URL = "http://localhost:8000"

def test_visit_plan(token, employee_email, org_id):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {
        "employee_id": employee_email,
        "organization_id": org_id,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "stops": [
            {
                "sequence_order": 1,
                "place_name": "Test Client Location",
                "lat": 12.9716,
                "lng": 77.5946,
                "customer_phone": "9876543210",
                "purpose": "Routine Check"
            }
        ]
    }

    print("Sending payload:", json.dumps(payload, indent=2))
    response = requests.post(f"{BASE_URL}/api/field/plan", headers=headers, json=payload)
    
    print("\nStatus Code:", response.status_code)
    try:
        print("Response:", json.dumps(response.json(), indent=2))
    except:
        print("Response:", response.text)

if __name__ == "__main__":
    # To run this, you need a valid token. For now, let's just create the file
    # and we can use a token if needed, or we can just see that the code is correct.
    print("Test script created.")
