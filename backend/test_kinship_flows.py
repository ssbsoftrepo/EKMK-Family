import urllib.request
import urllib.error
import json

BASE_URL = "http://localhost:8081"

def req(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    headers = {"Content-Type": "application/json"} if data is not None else {}
    request = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as response:
            content = response.read().decode("utf-8")
            return response.status, json.loads(content) if content.strip() else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"error": err_body}

print("=== STARTING FULL FLOW AND VALIDATION AUDIT SUITE ===")

# Test 1: Query members
status, members = req("/api/members")
assert status == 200, f"Expected 200, got {status}"
print(f"✓ Test 1: Successfully retrieved {len(members)} members from backend database")

balram = next(m for m in members if m["fullName"] == "Balram")
meenama = next(m for m in members if m["fullName"] == "Meenama")
anitha = next(m for m in members if m["fullName"] == "Anitha")
rani = next(m for m in members if m["fullName"] == "Rani")
raja = next(m for m in members if m["fullName"] == "Raja")
hariharan = next(m for m in members if m["fullName"] == "Hariharan")
nila = next(m for m in members if m["fullName"] == "Nila")
ravi = next(m for m in members if m["fullName"] == "Ravi")

# Test 1b: Verify multi-spouse links for Balram (2 wives: Meenama & Anitha)
assert meenama["id"] in balram["spouseIds"], "Meenama missing in Balram spouseIds"
assert anitha["id"] in balram["spouseIds"], "Anitha missing in Balram spouseIds"
assert balram["id"] in meenama["spouseIds"], "Balram missing in Meenama spouseIds"
assert balram["id"] in anitha["spouseIds"], "Balram missing in Anitha spouseIds"
print(f"✓ Test 1b: Balram is reciprocally linked to both wives (Meenama & Anitha)")

# Test 2: Kinship rule - Self as spouse
status, err = req(f"/api/members/{ravi['id']}", method="PUT", data={"spouseIds": [ravi["id"]]})
assert status == 400, f"Expected 400 for self-spouse, got {status}: {err}"
err_msg = err.get("message") or err.get("error") or str(err)
assert "own spouse" in err_msg, f"Unexpected error message: {err}"
print("✓ Test 2: Self as spouse correctly rejected by backend validation")

# Test 3: Kinship rule - Grandparent/Ancestor as spouse (Balram is grandfather of Nila)
status, err = req(f"/api/members/{nila['id']}", method="PUT", data={"spouseIds": [balram["id"]]})
assert status == 400, f"Expected 400 for ancestor spouse, got {status}: {err}"
err_msg = err.get("message") or err.get("error") or str(err)
assert "father, mother, grandfather" in err_msg, f"Unexpected error message: {err}"
print("✓ Test 3: Grandparent as spouse correctly rejected under Tamil Hindu kinship tradition")

# Test 4: Kinship rule - Sibling as spouse (Rani and Hariharan share same parents)
status, err = req(f"/api/members/{rani['id']}", method="PUT", data={"spouseIds": [hariharan["id"]]})
assert status == 400, f"Expected 400 for sibling spouse, got {status}: {err}"
err_msg = err.get("message") or err.get("error") or str(err)
assert "brother or sister" in err_msg, f"Unexpected error message: {err}"
print("✓ Test 4: Sibling as spouse correctly rejected under Tamil Hindu kinship tradition")

# Test 5: Chronology conflict - Child born earlier than father Adhi (born 1942-08-12)
adhi = next(m for m in members if m["fullName"] == "Adhi")
jayenthi = next(m for m in members if m["fullName"] == "jayenthi")
test_bad_child = {
    "fullName": "Premature Child",
    "gender": "male",
    "birthDate": "1930-01-01",
    "fatherId": adhi["id"],
    "motherId": jayenthi["id"],
}
status, err = req("/api/members", method="POST", data=test_bad_child)
assert status == 400, f"Expected 400 for chronology error, got {status}: {err}"
err_msg = err.get("message") or err.get("error") or str(err)
assert "cannot be before or equal to father's birth date" in err_msg, f"Unexpected error message: {err}"
print("✓ Test 5: Child birth date before father birth date correctly rejected")

# Test 6: Auto-inheritance of Branch & Generation for Child
test_valid_child = {
    "fullName": "Kavya",
    "gender": "female",
    "birthDate": "2015-08-20",
    "fatherId": raja["id"],
    "motherId": rani["id"],
}
status, created_child = req("/api/members", method="POST", data=test_valid_child)
assert status in (200, 201), f"Failed to create child: {created_child}"
assert created_child["generation"] == 3, f"Expected Gen 3, got {created_child['generation']}"
assert created_child["branchName"] == "Rani Branch", f"Expected Rani Branch, got {created_child['branchName']}"

# Verify father has child in childIds
_, updated_raja = req(f"/api/members/{raja['id']}")
assert created_child["id"] in updated_raja["childIds"], "Father childIds was not updated"
print("✓ Test 6: Child addition auto-inherited generation (Gen 3), branch ('Rani Branch') and updated father's childIds")

# Test 7: Clean deletion
status, _ = req(f"/api/members/{created_child['id']}", method="DELETE")
assert status in (200, 204), f"Failed to delete test child: {status}"
_, raja_after_delete = req(f"/api/members/{raja['id']}")
assert created_child["id"] not in raja_after_delete["childIds"], "Father still contains deleted child"
print("✓ Test 7: Child deletion cleanly removed child reference from parents")

# Test 8: Partial update protection (updating only city should NOT detach spouse)
status, updated_nila = req(f"/api/members/{nila['id']}", method="PUT", data={"currentCity": "Erode City"})
assert status == 200, f"Failed to update city: {updated_nila}"
assert updated_nila["currentCity"] == "Erode City", "City was not updated"
assert updated_nila["spouseId"] == ravi["id"] and ravi["id"] in updated_nila["spouseIds"], "Spouse detached during partial update!"
_, check_ravi = req(f"/api/members/{ravi['id']}")
assert check_ravi["spouseId"] == nila["id"] and nila["id"] in check_ravi["spouseIds"], "Ravi spouse detached during partial update!"
print("✓ Test 8: Partial update protection verified: updating currentCity did NOT detach spouse")

# Reset Nila's city back to original
req(f"/api/members/{nila['id']}", method="PUT", data={"currentCity": nila.get("currentCity", "Erode")})

# Test 9: Kinship rule - Cannot create member with father as spouse
test_parent_as_spouse = {
    "fullName": "Invalid Kinship Member",
    "gender": "female",
    "fatherId": balram["id"],
    "spouseIds": [balram["id"]],
}
status, err = req("/api/members", method="POST", data=test_parent_as_spouse)
assert status == 400, f"Expected 400 for father as spouse, got {status}: {err}"
err_msg = err.get("message") or err.get("error") or str(err)
assert "Cannot select father as spouse" in err_msg or "cannot select father" in err_msg.lower(), f"Unexpected error: {err_msg}"
print("✓ Test 9: Creating member with father as spouse rejected by backend")

# Test 10: Kinship rule - Cannot create member with mother as spouse
test_mother_as_spouse = {
    "fullName": "Invalid Kinship Member 2",
    "gender": "male",
    "motherId": meenama["id"],
    "spouseIds": [meenama["id"]],
}
status, err = req("/api/members", method="POST", data=test_mother_as_spouse)
assert status == 400, f"Expected 400 for mother as spouse, got {status}: {err}"
err_msg = err.get("message") or err.get("error") or str(err)
assert "Cannot select mother as spouse" in err_msg or "cannot select mother" in err_msg.lower(), f"Unexpected error: {err_msg}"
print("✓ Test 10: Creating member with mother as spouse rejected by backend")

# Test 11: Kinship rule - Updating existing member (Rani) to set father Balram as spouse
status, err = req(f"/api/members/{rani['id']}", method="PUT", data={"spouseIds": [balram["id"]]})
assert status == 400, f"Expected 400 for setting father as spouse on update, got {status}: {err}"
err_msg = err.get("message") or err.get("error") or str(err)
assert "Cannot select father as spouse" in err_msg or "cannot select father" in err_msg.lower(), f"Unexpected error: {err_msg}"
print("✓ Test 11: Updating member with father as spouse rejected by backend")

print("\nALL 11 AUDIT AND FULL-FLOW VALIDATION TESTS PASSED 100%!")
