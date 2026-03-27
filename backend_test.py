"""
Patek Shop Backend API Testing
"""
import requests
import sys
import json
from datetime import datetime

class PatekShopAPITester:
    def __init__(self, base_url="https://b4cf57de-bdf3-496a-8f16-0311d8a527a2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_key = "patek_shop_secret_key_2024_secure"
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': self.api_key
        }
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = self.headers if auth_required else {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

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
                    if isinstance(result["response_data"], dict) and len(str(result["response_data"])) < 500:
                        print(f"   Response: {result['response_data']}")
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
        """Test health check endpoint (no auth required)"""
        return self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200,
            auth_required=False
        )

    def test_admin_stats(self):
        """Test admin stats endpoint (auth required)"""
        return self.run_test(
            "Admin Stats",
            "GET",
            "api/admin/stats",
            200
        )

    def test_categories_crud(self):
        """Test categories CRUD operations"""
        print("\n📁 Testing Categories CRUD...")
        
        # List categories
        success, categories = self.run_test(
            "List Categories",
            "GET",
            "api/admin/categories",
            200
        )
        
        if not success:
            return False
            
        # Create a test category
        test_category = {
            "slug": "test-category",
            "name": "Test Category",
            "description": "Test category for API testing",
            "icon": "🧪",
            "position": 999
        }
        
        success, created_cat = self.run_test(
            "Create Category",
            "POST",
            "api/admin/categories",
            200,
            data=test_category
        )
        
        if not success:
            return False
            
        category_id = created_cat.get("id") if created_cat else None
        if not category_id:
            print("❌ Failed to get category ID from creation response")
            return False
            
        # Get specific category
        success, _ = self.run_test(
            "Get Category",
            "GET",
            f"api/admin/categories/{category_id}",
            200
        )
        
        # Update category
        update_data = {"name": "Updated Test Category"}
        success, _ = self.run_test(
            "Update Category",
            "PATCH",
            f"api/admin/categories/{category_id}",
            200,
            data=update_data
        )
        
        # Delete category
        success, _ = self.run_test(
            "Delete Category",
            "DELETE",
            f"api/admin/categories/{category_id}",
            200
        )
        
        return True

    def test_products_crud(self):
        """Test products CRUD operations"""
        print("\n📦 Testing Products CRUD...")
        
        # First get categories to use for product creation
        success, categories = self.run_test(
            "List Categories for Products",
            "GET",
            "api/admin/categories",
            200
        )
        
        if not success or not categories:
            print("❌ No categories available for product testing")
            return False
            
        category_id = categories[0]["id"]
        
        # List products
        success, products = self.run_test(
            "List Products",
            "GET",
            "api/admin/products",
            200
        )
        
        if not success:
            return False
            
        # Create a test product
        test_product = {
            "category_id": category_id,
            "sku": "TEST-001",
            "title": "Test Product",
            "description": "Test product for API testing",
            "price_cents": 1999,
            "stock": 10,
            "image_urls": ["https://via.placeholder.com/400"]
        }
        
        success, created_prod = self.run_test(
            "Create Product",
            "POST",
            "api/admin/products",
            200,
            data=test_product
        )
        
        if not success:
            return False
            
        product_id = created_prod.get("id") if created_prod else None
        if not product_id:
            print("❌ Failed to get product ID from creation response")
            return False
            
        # Get specific product
        success, _ = self.run_test(
            "Get Product",
            "GET",
            f"api/admin/products/{product_id}",
            200
        )
        
        # Update product
        update_data = {"title": "Updated Test Product", "price_cents": 2999}
        success, _ = self.run_test(
            "Update Product",
            "PATCH",
            f"api/admin/products/{product_id}",
            200,
            data=update_data
        )
        
        # Delete product
        success, _ = self.run_test(
            "Delete Product",
            "DELETE",
            f"api/admin/products/{product_id}",
            200
        )
        
        return True

    def test_orders_listing(self):
        """Test orders listing"""
        return self.run_test(
            "List Orders",
            "GET",
            "api/admin/orders",
            200
        )

    def test_users_listing(self):
        """Test users listing"""
        return self.run_test(
            "List Users",
            "GET",
            "api/admin/users",
            200
        )

    def test_tickets_listing(self):
        """Test tickets listing"""
        return self.run_test(
            "List Tickets",
            "GET",
            "api/admin/tickets",
            200
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Patek Shop API Tests...")
        print(f"Base URL: {self.base_url}")
        print(f"API Key: {self.api_key[:10]}...")
        
        # Test health endpoint (no auth)
        self.test_health_endpoint()
        
        # Test admin endpoints (with auth)
        self.test_admin_stats()
        
        # Test CRUD operations
        self.test_categories_crud()
        self.test_products_crud()
        
        # Test listing endpoints
        self.test_orders_listing()
        self.test_users_listing()
        self.test_tickets_listing()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        # Save detailed results
        results = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "tests_run": self.tests_run,
                "tests_passed": self.tests_passed,
                "tests_failed": self.tests_run - self.tests_passed,
                "success_rate": round(self.tests_passed / self.tests_run * 100, 1)
            },
            "test_results": self.test_results
        }
        
        with open('/app/test_reports/backend_api_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        return self.tests_passed == self.tests_run

def main():
    tester = PatekShopAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())