const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
var db = require('../db');
var async = require('async');
var mysql = require('mysql');


router.use(bodyParser.urlencoded({
    extended: false
}));
router.use(bodyParser.json());


function check_staff(req, res) {
    user = req.session.loggedUser;
    if (user.UserType === 'staff' || user.UserType === 'Staff') {
        res.redirect('/admin');
        return;
    }
}

// session validation
router.use('*', function (req, res, next) {
    if (!req.session.loggedUser) {
        res.redirect('/');
        return;
    }
    next();
});

router.get('/', function (req, res) {

    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'pharmacy'
    });
    
    var totalSell = "select ROUND(SUM(Total_Payable),2) AS sells_count from bill_information";
    var todaySell = "select ROUND(SUM(Total_Payable),2) AS sells_count_today from bill_information where Date = CURDATE()";
    var totalUser = "SELECT COUNT(*) AS users_count FROM user_information";
    var totalBatch = "SELECT COUNT(*) AS batch_count FROM batch";
    var totalMedicine = "SELECT COUNT(*) AS med_count FROM medicine_information";
    var totalSupplier = "SELECT COUNT(*) AS sup_count FROM supplier";
    var totalCategory = "SELECT COUNT(*) AS cat_count FROM category";
    var totalGeneric = "SELECT COUNT(*) AS generic_count FROM drug_generic_name";
    var totalManufac = "SELECT COUNT(*) AS manufac_count FROM manufacturer";
    
    async.parallel([
        function (callback) {
            connection.query(totalSell, callback)
        },
        function (callback) {
            connection.query(todaySell, callback)
        },
        function (callback) {
            connection.query(totalUser, callback)
        },
        function (callback) {
            connection.query(totalBatch, callback)
        },
        function (callback) {
            connection.query(totalMedicine, callback)
        },
        function (callback) {
            connection.query(totalSupplier, callback)
        },
        function (callback) {
            connection.query(totalCategory, callback)
        },
        function (callback) {
            connection.query(totalGeneric, callback)
        },
        function (callback) {
            connection.query(totalManufac, callback)
        }
    ], function (err, rows) {
    
    
        console.log(rows[0][0]);
        console.log(rows[1][0]);
        console.log(rows[2][0]);
    
    
        
    
        res.render('view_admin', {
            'totalSell': rows[0][0],
            'todaySell': rows[1][0],
            'totalUser': rows[2][0],
            'totalBatch': rows[3][0],
            'totalMedicine': rows[4][0],
            'totalSupplier': rows[5][0],
            'totalCategory': rows[6][0],
            'totalGeneric': rows[7][0],
            'totalManufac': rows[8][0],
            'user': req.session.loggedUser
        });
    });
    

    // res.render('view_admin', {
    //     user: req.session.loggedUser
    // });
});



router.get('/medicineSearch/:n', function (req, res) {

    var name = req.params.n;
    console.log(name);
    var query = "SELECT * FROM medicine_information WHERE Medicine_Name = ? ";

    db.getData(query, [name], function (rows) {
        var data = {
            'result': rows[0]
        };
        res.return(data);
    });
});




router.get('/user', function (req, res) {
    res.render('view_welcome', {
        user: req.session.loggedUser
    });
});

router.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/');
});


router.get('/sale', function (req, res) {
    var query = "SELECT b.*, m.Medicine_Name, s.Supplier_Name FROM batch b INNER JOIN medicine_information m on b.Medicine_ID = m.ID INNER JOIN supplier s on b.Supplier_ID = s.ID";

    db.getData(query, null, function (rows) {
        var data = {
            'batch': rows,
            user: req.session.loggedUser
        };
        res.render('new_sale', data);
    });
});

router.post('/sale', function (req, res) {
    var billInfo = {
        Invoice_No: req.body.invoice_number,
        Total_Amount: req.body.totalAmount,
        Discount: req.body.discount,
        Discount_Amount: req.body.discountAmount,
        Total_Payable: req.body.totalPayable,
        Paid: req.body.paid,
        Returned: req.body.return,
        Date: req.body.entry_date
    };
    console.log(billInfo);
    var query = "INSERT INTO bill_information SET ?";
    db.getData(query, [billInfo], function (rows) {
        console.log(rows);
        res.redirect('/admin/sale');
    });
});

router.get('/saleshistory', function (req, res) {
    var query = "SELECT * FROM bill_information";
    db.getData(query, null, function (rows) {
        var data = {
            'billInfo': rows,
            user: req.session.loggedUser
        };
        res.render('sales_history', data);
    });
});


router.get('/usermanagement', function (req, res) {


    check_staff(req, res);

    var query = "SELECT A.Name,A.Email,A.Gender,A.Date_of_Birth,A.Age,A.Address,A.Contact,A.Blood_Group,A.Marital_Status,A.Join_Date,A.Salary,A.Username,B.Password,B.Usertype FROM user_information A INNER JOIN user_access B ON A.Username=B.Username;";
    db.getData(query, null, function (rows) {
        var data = {
            'userInformation': rows,
            'user': req.session.loggedUser
        };
        res.render('user_management_index', data);
    });
});

router.get('/usermanagement/create', function (req, res) {

    check_staff(req, res);

    var data = {
        'user': req.session.loggedUser
    }
    res.render('user_management_create', data);
});

router.post('/usermanagement/create', function (req, res) {


    check_staff(req, res);

    var user_infromation = {
        Name: req.body.name,
        Email: req.body.email,
        Gender: req.body.gender,
        Date_of_Birth: req.body.user_dob,
        Age: req.body.age,
        Address: req.body.address,
        Contact: req.body.contact,
        Blood_Group: req.body.blood_group,
        Marital_Status: req.body.marital_status,
        Join_Date: req.body.join_date,
        Salary: req.body.salary,
        Username: req.body.username
    };
    var user_access = {
        Username: req.body.username,
        Password: req.body.password,
        Usertype: req.body.usertype,
    };
    console.log(user_infromation);
    console.log(user_access);
    var userAccessQuery = "INSERT INTO User_Access SET ?";
    var userInfoQuery = "INSERT INTO User_Information SET ?";

    db.getData(userAccessQuery, [user_access], function (rows) {
        db.getData(userInfoQuery, [user_infromation], function (err, rows) {
            res.redirect('/admin/usermanagement');
        });
    });
});

router.get('/usermanagement/edit/:id', function (req, res) {

    check_staff(req, res);

    var id = req.params.id;
    var query = "SELECT * FROM user_information WHERE Username = ? ";

    db.getData(query, [id], function (rows) {
        var data = {
            'userInfoEdit': rows[0],
            'user': req.session.loggedUser
        };
        res.render('user_management_edit', data);
    });
});

router.post('/usermanagement/edit/:id', function (req, res) {

    check_staff(req, res);

    var id = req.params.id;
    var userUpdate = {
        Name: req.body.name,
        Email: req.body.email,
        Age: req.body.age,
        Address: req.body.address,
        Contact: req.body.contact,
        Salary: req.body.salary
    };
    var query = "UPDATE user_information SET ? WHERE Username = ?";
    db.getData(query, [userUpdate, id], function (rows) {
        res.redirect('/admin/usermanagement');
    });

});

router.get('/usermanagement/delid=:id', function (req, res) {


    check_staff(req, res);

    var id = req.params.id;
    var query = "DELETE FROM user_access WHERE Username = ?";
    var query2 = "DELETE FROM user_information WHERE Username = ?";

    db.getData(query, [id], function (rows) {
        db.getData(query2, [id], function (rows) {
            res.redirect('/admin/usermanagement');
        });
    });
});

module.exports = router;