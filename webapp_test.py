"""
Patek Shop WebApp API Testing - Telegram Mini App Endpoints
"""
import requests
import sys
import json
from datetime import datetime

class PatekShopWebAppTester:
    def __init__(self, base_url="https://b4cf57de-bdf3-496a-8f16-0311d8a527a2.preview.emergentagent.com"):
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'X-Telegram-Init-Data': 'demo'  # Demo mode for testing
        }
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=self.headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=self.headers, timeout=10)

            success = response.status_code == expected_status
            
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_data": None,
                "error": None
            }

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    result["response_data"] = response.json()
                    if isinstance(result["response_data"], dict):
                        # Print key information for verification
                        if "user" in result["response_data"]:
                            print(f"   User: {result['response_data']['user'].get('first_name', 'N/A')}")
                        if "products_count" in result["response_data"]:
                            print(f"   Products Count: {result['response_data']['products_count']}")
                        if "categories" in result["response_data"]:
                            print(f"   Categories Count: {len(result['response_data']['categories'])}")
                        if "btc_address" in result["response_data"]:
                            print(f"   BTC Address: {result['response_data']['btc_address'][:20]}...")
                        if "ltc_address" in result["response_data"]:
                            print(f"   LTC Address: {result['response_data']['ltc_address'][:20]}...")
                except:
                    result["response_data"] = response.text[:200]
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    result["error"] = error_data
                    print(f"   Error: {error_data}")
                except:
                    result["error"] = response.text[:200]
                    print(f"   Error: {response.text[:200]}")

            self.test_results.append(result)
            return success, result["response_data"]

        except Exception as e:
            print(f"❌ Failed - Exception: {str(e)}")
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": "EXCEPTION",
                "success": False,
                "response_data": None,
                "error": str(e)
            }
            self.test_results.append(result)
            return False, {}

    def test_health_endpoint(self):
        """Test health check endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )

    def test_webapp_home(self):
        """Test webapp home endpoint"""
        success, data = self.run_test(
            "WebApp Home",
            "GET",
            "api/webapp/home",
            200
        )
        
        if success and data:
            # Verify expected data structure
            required_fields = ['user', 'balance_cents', 'products_count', 'categories']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                print(f"⚠️  Missing fields in response: {missing_fields}")
            else:
                print(f"✅ All required fields present")
                
            # Verify user data
            if 'user' in data and data['user']:
                user = data['user']
                print(f"   User ID: {user.get('id', 'N/A')}")
                print(f"   User Name: {user.get('first_name', 'N/A')}")
                print(f"   Balance: {data.get('balance_cents', 0) / 100:.2f} EUR")
                
        return success, data

    def test_webapp_categories(self):
        """Test webapp categories endpoint"""
        success, data = self.run_test(
            "WebApp Categories",
            "GET",
            "api/webapp/categories",
            200
        )
        
        if success and data:
            print(f"   Categories found: {len(data)}")
            for cat in data[:3]:  # Show first 3 categories
                print(f"   - {cat.get('name', 'N/A')} ({cat.get('products_count', 0)} products)")
                
        return success, data

    def test_webapp_deposit(self):
        """Test webapp deposit endpoint"""
        success, data = self.run_test(
            "WebApp Deposit",
            "GET",
            "api/webapp/deposit",
            200
        )
        
        if success and data:
            # Verify crypto addresses are present
            if 'btc_address' in data and data['btc_address']:
                print(f"   BTC Address: ✅ Present")
            else:
                print(f"   BTC Address: ❌ Missing")
                
            if 'ltc_address' in data and data['ltc_address']:
                print(f"   LTC Address: ✅ Present")
            else:
                print(f"   LTC Address: ❌ Missing")
                
        return success, data

    def test_webapp_cart(self):
        """Test webapp cart endpoint"""
        success, data = self.run_test(
            "WebApp Cart",
            "GET",
            "api/webapp/cart",
            200
        )
        
        if success and data:
            cart = data.get('cart', {})
            items = cart.get('items', [])
            total = data.get('total_cents', 0)
            print(f"   Cart items: {len(items)}")
            print(f"   Cart total: {total / 100:.2f} EUR")
                
        return success, data

    def test_webapp_me(self):
        """Test webapp me endpoint"""
        return self.run_test(
            "WebApp Me",
            "GET",
            "api/webapp/me",
            200
        )

    def run_all_tests(self):
        """Run all WebApp API tests"""
        print("🚀 Starting Patek Shop WebApp API Tests...")
        print(f"Base URL: {self.base_url}")
        print(f"Headers: {self.headers}")
        
        # Test health endpoint
        self.test_health_endpoint()
        
        # Test webapp endpoints
        self.test_webapp_me()
        self.test_webapp_home()
        self.test_webapp_categories()
        self.test_webapp_deposit()
        self.test_webapp_cart()
        
        # Print summary
        print(f"\n📊 WebApp Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        # Save detailed results
        results = {
            "timestamp": datetime.now().isoformat(),
            "test_type": "webapp_api",
            "summary": {
                "tests_run": self.tests_run,
                "tests_passed": self.tests_passed,
                "tests_failed": self.tests_run - self.tests_passed,
                "success_rate": round(self.tests_passed / self.tests_run * 100, 1)
            },
            "test_results": self.test_results
        }
        
        with open('/app/test_reports/webapp_api_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        return self.tests_passed == self.tests_run

def main():
    tester = PatekShopWebAppTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())