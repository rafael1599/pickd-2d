export const WAREHOUSE_STRUCTURE = {
    bays: [
        { id: "bay-1", name: "Bay 1 (Bulk & Overflow)", rows: [41, 42, 43, 44, 51] },
        { id: "bay-2", name: "Bay 2 (Primary Logistics)", rows: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, "19B"] },
        { id: "bay-3", name: "Bay 3 (Secondary Storage)", rows: [20, "20B", 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34] }
    ]
};

export const WAREHOUSE_ROWS = [
    { row: 1, length: 52, widthFt: 8 },
    { row: 2, length: 52, widthFt: 8 },
    { row: 3, length: 52, widthFt: 8 },
    { row: 4, length: 45, widthFt: 8 },
    { row: 5, length: 45, widthFt: 8 },
    { row: 6, length: 45, widthFt: 8 },
    { row: 7, length: 52, widthFt: 8 },
    { row: 8, length: 52, widthFt: 8 },
    { row: 9, length: 52, widthFt: 8 },
    { row: 10, length: 52, widthFt: 8 },
    { row: 11, length: 52, widthFt: 8 },
    { row: 12, length: 52, widthFt: 8 },
    { row: 13, length: 45, widthFt: 8 },
    { row: 14, length: 45, widthFt: 8 },
    { row: 15, length: 45, widthFt: 8 },
    { row: 16, length: 52, widthFt: 8 },
    { row: 17, length: 52, widthFt: 8 },
    { row: 18, length: 52, widthFt: 8 },
    { row: 19, length: 52, widthFt: 8 },
    { row: "19B", length: 52, widthFt: 8 },
    { row: 20, length: 52, widthFt: 8 },
    { row: "20B", length: 52, widthFt: 8 },
    { row: 21, length: 52, widthFt: 8 },
    { row: 22, length: 52, widthFt: 8 },
    { row: 23, length: 52, widthFt: 8 },
    { row: 24, length: 52, widthFt: 8 },
    { row: 25, length: 52, widthFt: 8 },
    { row: 26, length: 52, widthFt: 8 },
    { row: 27, length: 52, widthFt: 8 },
    { row: 28, length: 52, widthFt: 8 },
    { row: 29, length: 52, widthFt: 8 },
    { row: 30, length: 52, widthFt: 8 },
    { row: 31, length: 52, widthFt: 8 },
    { row: 32, length: 52, widthFt: 8 },
    { row: 33, length: 52, widthFt: 8 },
    { row: 34, length: 52, widthFt: 8 },
    { row: 41, length: 60, widthFt: 8 },
    { row: 42, length: 60, widthFt: 8 },
    { row: 43, length: 65, widthFt: 20, type: 'block' },
    { row: 44, length: 60, widthFt: 8 },
    { row: 51, length: 60, widthFt: 8 }
];

export const INITIAL_INVENTORY = {
    1: [
        { sku: "03-1293BK", qty: 1 }, { sku: "03-3161GY", qty: 1 }, { sku: "03-3300BL", qty: 1 },
        { sku: "03-3313GY", qty: 1 }, { sku: "03-3373CL", qty: 1 }, { sku: "03-3382BK", qty: 7 },
        { sku: "03-3781BL", qty: 1 }, { sku: "03-3828GY", qty: 1 }, { sku: "03-3861BK", qty: 1 },
        { sku: "03-3882BK", qty: 1 }, { sku: "03-3885BK", qty: 1 }, { sku: "03-3895BL", qty: 1 },
        { sku: "03-3966BL", qty: 1 }, { sku: "03-3995PD", qty: 2 }, { sku: "03-4207BR", qty: 2 },
        { sku: "03-4209GY", qty: 1 }, { sku: "03-4227BL", qty: 1 }, { sku: "03-4230BL", qty: 3 },
        { sku: "03-4448BK", qty: 2 }, { sku: "03-4450BK", qty: 1 }, { sku: "03-4456BL", qty: 2 },
        { sku: "03-4457GN", qty: 2 }, { sku: "03-4458GN", qty: 2 }, { sku: "03-4462GN", qty: 2 },
        { sku: "03-4468BR", qty: 4 }, { sku: "03-4515GY", qty: 20 }, { sku: "03-4545MN", qty: 10 },
        { sku: "06-4293MG", qty: 1 }, { sku: "06-4294MVC", qty: 1 }, { sku: "06-4296RD", qty: 1 },
        { sku: "06-4297RD", qty: 3 }, { sku: "06-4432BK", qty: 43 }, { sku: "06-4473TL", qty: 66 },
        { sku: "06-4507BK", qty: 24 }, { sku: "06-4614GN", qty: 1 }, { sku: "06-4615GN", qty: 1 },
        { sku: "06-4627LDV", qty: 1 }, { sku: "07-3529BL", qty: 1 }, { sku: "07-3639GR", qty: 2 },
        { sku: "07-3641RD", qty: 1 }, { sku: "07-3642VL", qty: 3 }
    ],
    2: [
        { sku: "03-3027CL", qty: 1 }, { sku: "03-3492BL", qty: 1 }, { sku: "03-3803BL", qty: 18 },
        { sku: "03-3807GN", qty: 1 }, { sku: "03-3827BL", qty: 3 }, { sku: "03-3892RD", qty: 2 },
        { sku: "03-3934MN", qty: 32 }, { sku: "03-3954GY", qty: 1 }, { sku: "03-4059PD", qty: 1 },
        { sku: "03-4076SG", qty: 1 }, { sku: "03-4088SL", qty: 1 }, { sku: "03-4231BL", qty: 2 },
        { sku: "03-4258BL", qty: 8 }, { sku: "03-4449BK", qty: 2 }, { sku: "03-4454BL", qty: 1 },
        { sku: "03-4460GN", qty: 7 }, { sku: "06-4430RB", qty: 21 }, { sku: "06-4445WH", qty: 6 },
        { sku: "06-4447BL", qty: 2 }, { sku: "06-4448WH", qty: 1 }, { sku: "06-4457RD", qty: 3 },
        { sku: "06-4524KW", qty: 1 }, { sku: "06-4573GY", qty: 42 }, { sku: "06-4587RD", qty: 18 },
        { sku: "06-4611GN", qty: 1 }, { sku: "06-4616RD", qty: 11 }, { sku: "06-4617RD", qty: 32 }
    ],
    3: [
        { sku: "03-3854GY", qty: 13 }, { sku: "03-3927BK", qty: 45 }, { sku: "03-3977GY", qty: 29 },
        { sku: "03-3997PD", qty: 24 }, { sku: "03-3999PD", qty: 32 }, { sku: "03-4044BK", qty: 14 },
        { sku: "03-4046MN", qty: 2 }, { sku: "03-4272BK", qty: 24 }, { sku: "03-4512GY", qty: 29 },
        { sku: "03-4536BL", qty: 4 }, { sku: "06-4457BK", qty: 14 }, { sku: "06-4585RD", qty: 6 },
        { sku: "UNDO-OLD-EXISTS", qty: 5 }
    ],
    4: [
        { sku: "03-3789BL", qty: 4 }, { sku: "03-3810GN", qty: 2 }, { sku: "03-3905BL", qty: 22 },
        { sku: "03-3906GY", qty: 17 }, { sku: "03-4257BL", qty: 4 }, { sku: "03-4455BL", qty: 2 },
        { sku: "06-4562BL", qty: 51 }, { sku: "06-4572GY", qty: 48 }, { sku: "06-4606OR", qty: 52 },
        { sku: "07-3674GY", qty: 3 }
    ],
    5: [
        { sku: "03-3031SL", qty: 1 }, { sku: "03-3501BL", qty: 2 }, { sku: "03-3872BL", qty: 25 },
        { sku: "03-3993PD", qty: 7 }, { sku: "03-4161BL", qty: 41 }, { sku: "03-4277GN", qty: 7 },
        { sku: "03-4461GN", qty: 2 }, { sku: "03-4466BR", qty: 14 }, { sku: "03-4467BR", qty: 6 },
        { sku: "06-4450BL", qty: 25 }, { sku: "06-4455SL", qty: 19 }, { sku: "06-4456BL", qty: 21 },
        { sku: "06-4461SL", qty: 4 }, { sku: "06-4565BL", qty: 1 }, { sku: "06-4590BL", qty: 27 },
        { sku: "06-4641BK", qty: 16 }
    ],
    6: [
        { sku: "03-3517BL", qty: 1 }, { sku: "03-3746GY", qty: 1 }, { sku: "03-3848BK", qty: 4 },
        { sku: "03-3908GY", qty: 50 }, { sku: "03-4268BK", qty: 38 }, { sku: "03-4547MN", qty: 12 },
        { sku: "03-4889GY", qty: 45 }, { sku: "06-4451BK", qty: 11 }, { sku: "06-4458SL", qty: 25 },
        { sku: "06-4470TL", qty: 51 }, { sku: "06-4566VL", qty: 2 }, { sku: "06-4608MN", qty: 1 }
    ],
    7: [
        { sku: "03-3060CL", qty: 3 }, { sku: "03-3842BL", qty: 13 }, { sku: "03-3842BR", qty: 5 },
        { sku: "03-4069BL", qty: 66 }, { sku: "03-4075BL", qty: 1 }, { sku: "03-4199GN", qty: 2 },
        { sku: "03-4213GY", qty: 6 }, { sku: "03-4251BK", qty: 5 }, { sku: "03-4259BL", qty: 3 },
        { sku: "03-4270BK", qty: 34 }, { sku: "03-4473BK", qty: 2 }, { sku: "03-4531GY", qty: 8 },
        { sku: "06-4427RB", qty: 32 }, { sku: "06-4452SL", qty: 19 }, { sku: "06-4607OR", qty: 20 }
    ],
    8: [
        { sku: "03-2540WH", qty: 2 }, { sku: "03-3058CL", qty: 3 }, { sku: "03-3062CL", qty: 4 },
        { sku: "03-3502BL", qty: 3 }, { sku: "03-3516BL", qty: 2 }, { sku: "03-3742BK", qty: 30 },
        { sku: "03-3767MN", qty: 2 }, { sku: "03-3859BL", qty: 9 }, { sku: "03-4040BK", qty: 43 },
        { sku: "03-4066BK", qty: 17 }, { sku: "03-4254BK", qty: 3 }, { sku: "03-4464BR", qty: 8 },
        { sku: "06-4485BL", qty: 37 }, { sku: "06-4563BL", qty: 55 }
    ],
    9: [
        { sku: "03-3764BK", qty: 3 }, { sku: "03-3901BL", qty: 31 }, { sku: "03-3960GY", qty: 9 },
        { sku: "03-3965BL", qty: 30 }, { sku: "03-3985GY", qty: 24 }, { sku: "03-3992BL", qty: 11 },
        { sku: "03-4011SL", qty: 14 }, { sku: "03-4054BL", qty: 1 }, { sku: "03-4160GN", qty: 44 },
        { sku: "03-4200GN", qty: 3 }, { sku: "03-4261BR", qty: 6 }, { sku: "03-4267GN", qty: 15 }
    ],
    10: [
        { sku: "03-3736BK", qty: 16 }, { sku: "03-3793PD", qty: 22 }, { sku: "03-3969BL", qty: 1 },
        { sku: "03-4051PD", qty: 4 }, { sku: "03-4052BL", qty: 3 }, { sku: "03-4058BL", qty: 12 },
        { sku: "03-4250BK", qty: 4 }, { sku: "03-4253BK", qty: 23 }, { sku: "03-4265BR", qty: 3 },
        { sku: "03-4276BK", qty: 9 }, { sku: "03-4370BL", qty: 17 }, { sku: "03-4528GY", qty: 24 },
        { sku: "03-4529GY", qty: 24 }, { sku: "03-4530GY", qty: 15 }, { sku: "03-4533BL", qty: 15 },
        { sku: "06-4639GN", qty: 19 }
    ],
    11: [
        { sku: "03-3750GY", qty: 1 }, { sku: "03-3754GY", qty: 4 }, { sku: "03-3846BL", qty: 11 },
        { sku: "03-3912GY", qty: 27 }, { sku: "03-3929BK", qty: 21 }, { sku: "03-4023SL", qty: 2 },
        { sku: "03-4067BL", qty: 27 }, { sku: "03-4085BK", qty: 35 }, { sku: "03-4212GY", qty: 17 },
        { sku: "06-4515BK", qty: 44 }, { sku: "06-4523BK", qty: 3 }, { sku: "06-4582BL", qty: 35 },
        { sku: "06-4586BL", qty: 7 }
    ],
    12: [
        { sku: "03-3681GY", qty: 1 }, { sku: "03-3718GY", qty: 1 }, { sku: "03-3719GY", qty: 1 },
        { sku: "03-3817GY", qty: 2 }, { sku: "03-3836BK", qty: 46 }, { sku: "03-3846BR", qty: 5 },
        { sku: "03-3852GY", qty: 30 }, { sku: "03-3853GY", qty: 17 }, { sku: "03-3855GY", qty: 22 },
        { sku: "03-3856GY", qty: 9 }, { sku: "03-3917BR", qty: 5 }, { sku: "03-3994BL", qty: 14 },
        { sku: "03-4201GN", qty: 3 }, { sku: "03-4203BR", qty: 2 }, { sku: "03-4208GY", qty: 1 },
        { sku: "03-4252BK", qty: 14 }, { sku: "03-4463BR", qty: 5 }, { sku: "03-4465BR", qty: 12 },
        { sku: "06-4588BL", qty: 45 }
    ],
    13: [
        { sku: "03-3646OR", qty: 1 }, { sku: "03-3654GY", qty: 17 }, { sku: "03-3660BK", qty: 12 },
        { sku: "03-3661BK", qty: 3 }, { sku: "03-3688BL", qty: 13 }, { sku: "03-3689BL", qty: 14 },
        { sku: "03-3690BL", qty: 7 }, { sku: "03-3698BK", qty: 15 }, { sku: "03-3700BK", qty: 13 }
    ],
    14: [
        { sku: "03-3779RD", qty: 98 }, { sku: "03-4517BL", qty: 49 }
    ],
    15: [
        { sku: "03-3730BL", qty: 3 }, { sku: "03-3849BL", qty: 16 }, { sku: "03-3857BL", qty: 27 },
        { sku: "03-3947BL", qty: 3 }, { sku: "03-4082SL", qty: 53 }, { sku: "03-4375GN", qty: 21 },
        { sku: "03-4376GN", qty: 7 }, { sku: "03-4527GY", qty: 10 }, { sku: "03-4532BL", qty: 6 },
        { sku: "03-4534BL", qty: 7 }, { sku: "03-4546MN", qty: 23 }
    ],
    16: [
        { sku: "03-3753BL", qty: 10 }, { sku: "03-3777RD", qty: 6 }, { sku: "03-3778BK", qty: 26 },
        { sku: "03-3919GN", qty: 7 }, { sku: "03-4065BL", qty: 64 }, { sku: "03-4275GN", qty: 18 },
        { sku: "03-4514GY", qty: 24 }, { sku: "06-4516KW", qty: 32 }, { sku: "07-3673BK", qty: 7 }
    ],
    17: [
        { sku: "03-3791PD", qty: 7 }, { sku: "03-3980BL", qty: 30 }, { sku: "03-4071BL", qty: 62 },
        { sku: "03-4241GY", qty: 12 }, { sku: "03-4273GN", qty: 9 }, { sku: "06-4454BK", qty: 44 },
        { sku: "06-4564BL", qty: 12 }, { sku: "06-4604OR", qty: 24 }
    ],
    18: [
        { sku: "06-4284TL", qty: 140 }, { sku: "07-3606GP", qty: 1 }, { sku: "07-3626BL", qty: 3 },
        { sku: "07-3629RD", qty: 17 }, { sku: "07-3692BL", qty: 10 }
    ],
    19: [
        { sku: "07-3664PK", qty: 74 }, { sku: "07-3671SG", qty: 24 }, { sku: "07-3672SG", qty: 25 },
        { sku: "07-3680PD", qty: 3 }, { sku: "07-3682BK", qty: 2 }, { sku: "07-3684BL", qty: 7 },
        { sku: "07-3686BK", qty: 32 }, { sku: "07-3697BK", qty: 12 }, { sku: "07-3698GN", qty: 10 }
    ],
    "19B": [
        { sku: "07-3663BL", qty: 49 }, { sku: "07-3689WH", qty: 67 }, { sku: "07-3690BL", qty: 92 }
    ],
    20: [
        { sku: "03-3647OR", qty: 3 }, { sku: "03-3648OR", qty: 1 }, { sku: "03-3651GN", qty: 2 },
        { sku: "03-3652GN", qty: 1 }, { sku: "03-3653GY", qty: 1 }, { sku: "03-3655GY", qty: 12 },
        { sku: "03-3656GY", qty: 5 }, { sku: "03-3659BK", qty: 7 }, { sku: "03-3673RD", qty: 1 },
        { sku: "03-3674BL", qty: 1 }, { sku: "03-3676BL", qty: 11 }, { sku: "03-3677BL", qty: 12 },
        { sku: "03-3679GY", qty: 1 }, { sku: "03-3680GY", qty: 1 }, { sku: "03-3681GY", qty: 10 },
        { sku: "03-3682GY", qty: 6 }, { sku: "03-3684BR", qty: 9 }, { sku: "03-3685BR", qty: 6 },
        { sku: "03-3696BK", qty: 3 }, { sku: "03-3697BL", qty: 1 }, { sku: "03-3699BL", qty: 4 },
        { sku: "03-3699GY", qty: 10 }, { sku: "03-3701BL", qty: 1 }, { sku: "03-3701GY", qty: 4 },
        { sku: "03-3702BK", qty: 10 }, { sku: "03-4239GY", qty: 7 }
    ],
    "20B": [
        { sku: "06-4652BK", qty: 27 }, { sku: "06-4654PU", qty: 25 }, { sku: "06-4655YL", qty: 14 }
    ],
    21: [
        { sku: "03-3731GY", qty: 71 }, { sku: "03-3922BL", qty: 72 }, { sku: "03-3933BK", qty: 88 },
        { sku: "03-4083BK", qty: 60 }
    ],
    22: [
        { sku: "03-3844BR", qty: 5 }, { sku: "03-3898GY", qty: 13 }, { sku: "03-3924BL", qty: 36 },
        { sku: "03-3955GN", qty: 22 }, { sku: "03-3956GY", qty: 28 }, { sku: "03-3964GY", qty: 25 },
        { sku: "03-3987GY", qty: 48 }, { sku: "03-4009SL", qty: 14 }, { sku: "03-4010BK", qty: 2 },
        { sku: "03-4036BR", qty: 4 }, { sku: "03-4083BK", qty: 4 }, { sku: "03-4240GY", qty: 9 },
        { sku: "03-4248GY", qty: 8 }, { sku: "03-4372BL", qty: 7 }, { sku: "03-4535GY", qty: 13 },
        { sku: "03-4540BL", qty: 25 }
    ],
    23: [
        { sku: "03-3727BK", qty: 5 }, { sku: "03-3840BK", qty: 13 }, { sku: "03-3868BL", qty: 54 },
        { sku: "03-3904GY", qty: 11 }, { sku: "03-3910GY", qty: 46 }, { sku: "03-3913BR", qty: 11 },
        { sku: "03-3937BL", qty: 1 }, { sku: "03-3976BL", qty: 30 }, { sku: "03-4001PD", qty: 8 },
        { sku: "03-4039BR", qty: 28 }, { sku: "03-4269GN", qty: 23 }, { sku: "03-4271GN", qty: 6 },
        { sku: "03-4274BK", qty: 18 }, { sku: "03-4538BL", qty: 9 }, { sku: "03-4544BL", qty: 6 }
    ],
    24: [
        { sku: "03-3805BL", qty: 18 }, { sku: "03-3837BK", qty: 24 }, { sku: "03-3843BL", qty: 10 },
        { sku: "03-3843BR", qty: 5 }, { sku: "03-3958GY", qty: 12 }, { sku: "03-3998BL", qty: 18 },
        { sku: "03-4028BL", qty: 2 }, { sku: "03-4037BK", qty: 69 }, { sku: "03-4079BK", qty: 10 },
        { sku: "03-4090BL", qty: 11 }, { sku: "03-4093SL", qty: 24 }, { sku: "03-4516BL", qty: 22 },
        { sku: "03-4541GY", qty: 17 }, { sku: "03-4605OR", qty: 40 }
    ],
    25: [
        { sku: "03-3773RD", qty: 3 }, { sku: "03-3850BL", qty: 14 }, { sku: "03-3851BL", qty: 7 },
        { sku: "03-3877GY", qty: 8 }, { sku: "03-3903BL", qty: 1 }, { sku: "03-3930BL", qty: 21 },
        { sku: "03-3953GN", qty: 16 }, { sku: "03-3971MN", qty: 28 }, { sku: "03-4025GY", qty: 25 },
        { sku: "03-4026BL", qty: 1 }, { sku: "03-4158GN", qty: 36 }, { sku: "03-4263BR", qty: 8 },
        { sku: "03-4626BR", qty: 12 }, { sku: "03-4627BR", qty: 20 }, { sku: "03-4982BL", qty: 25 },
        { sku: "03-4984BL", qty: 24 }, { sku: "06-4453BL", qty: 25 }
    ],
    26: [
        { sku: "03-3745GN", qty: 10 }, { sku: "03-3771RD", qty: 33 }, { sku: "03-3825GY", qty: 1 },
        { sku: "03-3834BL", qty: 5 }, { sku: "03-3848BL", qty: 18 }, { sku: "03-3911MN", qty: 2 },
        { sku: "03-3986TL", qty: 25 }, { sku: "03-4249GY", qty: 2 }, { sku: "03-4539GY", qty: 28 },
        { sku: "03-4542BL", qty: 13 }, { sku: "03-4630GY", qty: 13 }, { sku: "03-4631GY", qty: 30 },
        { sku: "03-4633GY", qty: 10 }, { sku: "03-4979BL", qty: 3 }, { sku: "03-4980BL", qty: 3 },
        { sku: "03-4983BL", qty: 16 }, { sku: "06-4475BL", qty: 2 }, { sku: "06-4519BK", qty: 10 }
    ],
    27: [
        { sku: "03-3886RD", qty: 5 }, { sku: "03-3902GY", qty: 56 }, { sku: "03-3916BR", qty: 14 },
        { sku: "03-3918GN", qty: 11 }, { sku: "03-3925BK", qty: 9 }, { sku: "03-3931BK", qty: 29 },
        { sku: "03-4091SL", qty: 41 }, { sku: "03-4214BR", qty: 1 }, { sku: "03-4260BR", qty: 11 },
        { sku: "03-4371BL", qty: 18 }, { sku: "03-4511GY", qty: 2 }, { sku: "06-4464BL", qty: 2 }
    ],
    28: [
        { sku: "03-3740BK", qty: 28 }, { sku: "03-3743GN", qty: 49 }, { sku: "03-3755BL", qty: 5 },
        { sku: "03-3787BL", qty: 8 }, { sku: "03-3802BL", qty: 14 }, { sku: "03-3845BL", qty: 8 },
        { sku: "03-3845BR", qty: 5 }, { sku: "03-3864BK", qty: 10 }, { sku: "03-3899BL", qty: 57 },
        { sku: "03-3996BL", qty: 3 }, { sku: "03-4006BL", qty: 10 }, { sku: "03-4246GY", qty: 4 },
        { sku: "03-4513GY", qty: 45 }, { sku: "03-4537GY", qty: 28 }, { sku: "03-4628BR", qty: 4 },
        { sku: "03-4629BR", qty: 8 }, { sku: "06-4612PK", qty: 1 }, { sku: "06-4635OR", qty: 3 }
    ],
    29: [
        { sku: "03-3751BL", qty: 34 }, { sku: "03-3752GY", qty: 2 }, { sku: "03-3787BL", qty: 8 },
        { sku: "03-3788BL", qty: 14 }, { sku: "03-3794RD", qty: 17 }, { sku: "03-3804BL", qty: 22 },
        { sku: "03-3841BK", qty: 1 }, { sku: "03-3873BL", qty: 8 }, { sku: "03-3923BK", qty: 2 },
        { sku: "03-3935BK", qty: 55 }, { sku: "03-3962GY", qty: 24 }, { sku: "03-4159BL", qty: 40 },
        { sku: "03-4543GY", qty: 7 }, { sku: "06-4438BK", qty: 38 }, { sku: "06-4482BL", qty: 7 },
        { sku: "06-4568BK", qty: 3 }, { sku: "06-4640GN", qty: 13 }
    ],
    30: [
        { sku: "03-3932MN", qty: 8 }, { sku: "03-4369BL", qty: 3 }, { sku: "06-4637OR", qty: 25 }
    ],
    31: [
        { sku: "03-3724RD", qty: 12 }, { sku: "03-3770BK", qty: 10 }, { sku: "03-3772BK", qty: 2 },
        { sku: "03-3792RD", qty: 13 }, { sku: "03-3847BK", qty: 10 }, { sku: "03-3847BL", qty: 3 },
        { sku: "03-3900GY", qty: 60 }, { sku: "03-3921BK", qty: 31 }, { sku: "03-4029GY", qty: 1 },
        { sku: "03-4041BL", qty: 41 }, { sku: "03-4080SL", qty: 41 }, { sku: "03-4211GY", qty: 7 },
        { sku: "03-4266BK", qty: 13 }, { sku: "06-4636BK", qty: 15 }, { sku: "06-4638BK", qty: 44 }
    ],
    32: [
        { sku: "03-3726RD", qty: 53 }, { sku: "03-3729GY", qty: 20 }, { sku: "03-3732BL", qty: 53 },
        { sku: "03-3738BK", qty: 37 }, { sku: "03-3766BK", qty: 6 }, { sku: "03-3796RD", qty: 7 },
        { sku: "03-3871BL", qty: 40 }, { sku: "03-3875BL", qty: 1 }, { sku: "03-3897BL", qty: 35 },
        { sku: "03-3990TL", qty: 28 }, { sku: "03-4024BL", qty: 33 }, { sku: "03-4228BL", qty: 5 },
        { sku: "03-4229BL", qty: 5 }, { sku: "03-4264BR", qty: 7 }
    ],
    33: [
        { sku: "03-3733GY", qty: 79 }, { sku: "03-3734BL", qty: 74 }, { sku: "03-3735GY", qty: 38 },
        { sku: "03-3737GN", qty: 1 }, { sku: "03-3747BL", qty: 1 }, { sku: "03-3790RD", qty: 3 },
        { sku: "03-3795PD", qty: 25 }, { sku: "03-3801PD", qty: 1 }, { sku: "03-3824GY", qty: 1 },
        { sku: "03-3858BL", qty: 13 }, { sku: "03-3957GN", qty: 9 }, { sku: "03-4247GY", qty: 9 },
        { sku: "03-4374GN", qty: 15 }
    ],
    34: [
        { sku: "03-3768BL", qty: 10 }, { sku: "03-3976BL", qty: 61 }, { sku: "03-3980BL", qty: 74 },
        { sku: "03-4034BK", qty: 157 }, { sku: "03-4038BL", qty: 180 }, { sku: "03-4067BL", qty: 43 }
    ],
    41: [
        { sku: "03-3768BL", qty: 112 }, { sku: "03-3769BL", qty: 102 }, { sku: "03-3977GY", qty: 58 },
        { sku: "03-3984BL", qty: 88 }, { sku: "03-4066BK", qty: 78 }, { sku: "03-4084SL", qty: 75 },
        { sku: "03-4890BL", qty: 71 }, { sku: "06-4435BK", qty: 80 }, { sku: "06-4584BL", qty: 147 }
    ],
    42: [
        { sku: "03-3744BK", qty: 53 }, { sku: "03-3926BL", qty: 44 }, { sku: "03-3936MN", qty: 67 },
        { sku: "03-3978BL", qty: 318 }, { sku: "03-3979GY", qty: 270 }, { sku: "03-3982BL", qty: 298 },
        { sku: "03-4068BK", qty: 184 }, { sku: "03-4081BK", qty: 60 }, { sku: "03-4086SL", qty: 59 },
        { sku: "03-4094BL", qty: 56 }
    ],
    43: [
        { sku: "03-3928BL", qty: 71 }, { sku: "03-3981GY", qty: 306 }, { sku: "03-3983GY", qty: 296 },
        { sku: "03-4035BL", qty: 191 }, { sku: "03-4070BK", qty: 236 }, { sku: "03-4609BL", qty: 5 },
        { sku: "03-4610BK", qty: 5 }, { sku: "03-4614BK", qty: 1 }, { sku: "03-4615BK", qty: 5 },
        { sku: "03-4617BK", qty: 1 }, { sku: "03-4618GN", qty: 3 }
    ],
    44: [
        { sku: "03-4072BK", qty: 22 }
    ],
    51: [
        { sku: "03-4606BL", qty: 5 }, { sku: "03-4607BL", qty: 15 }, { sku: "03-4608BL", qty: 12 },
        { sku: "03-4611BK", qty: 24 }, { sku: "03-4612BK", qty: 25 }, { sku: "03-4613BK", qty: 5 },
        { sku: "03-4616BK", qty: 5 }, { sku: "03-4619GN", qty: 14 }, { sku: "03-4620GN", qty: 15 },
        { sku: "03-4621GN", qty: 2 }, { sku: "03-4622BL", qty: 3 }, { sku: "03-4623BL", qty: 10 },
        { sku: "03-4624BL", qty: 14 }, { sku: "03-4625BL", qty: 3 }
    ]
};
